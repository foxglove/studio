// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Theme } from "@mui/material";
import * as Comlink from "comlink";
import EventEmitter from "eventemitter3";

import { debouncePromise } from "@foxglove/den/async";
import { filterMap } from "@foxglove/den/collection";
import { Immutable } from "@foxglove/studio";
import { Bounds1D } from "@foxglove/studio-base/components/TimeBasedChart/types";
import { GlobalVariables } from "@foxglove/studio-base/hooks/useGlobalVariables";
import { PlayerState } from "@foxglove/studio-base/players/types";
import { Bounds } from "@foxglove/studio-base/types/Bounds";
import { getLineColor } from "@foxglove/studio-base/util/plotColors";

import {
  ChartRenderer,
  HoverElement,
  InteractionEvent,
  Scale,
  UpdateAction,
} from "./ChartRenderer";
import type { Service } from "./ChartRenderer.worker";
import { CsvDataset, IDatasetsBuilder, Viewport } from "./builders/IDatasetsBuilder";
import { isReferenceLinePlotPathType } from "./internalTypes";
import type { PlotConfig } from "./types";

type EventTypes = {
  timeseriesBounds(bounds: Immutable<Bounds1D>): void;

  /** X scale changed. */
  xScaleChanged(scale: Scale | undefined): void;
};

// If the datasets builder is garbage collected we also need to cleanup the worker
// This registry ensures the worker is cleaned up when the builder is garbage collected
const registry = new FinalizationRegistry<Worker>((worker) => {
  worker.terminate();
});

/**
 * PlotCoordinator interfaces commands and updates between the dataset builder and the chart
 * renderer.
 */
export class PlotCoordinator extends EventEmitter<EventTypes> {
  #renderingWorker: Worker;
  #canvas: OffscreenCanvas;
  #renderer?: Promise<Comlink.RemoteObject<ChartRenderer>>;

  #datasetsBuilder: IDatasetsBuilder;

  #configBounds: { x: Partial<Bounds1D>; y: Partial<Bounds1D> } = {
    x: {},
    y: {},
  };

  #timeseriesRange?: Immutable<Partial<Bounds1D>>;
  #datasetRange?: Bounds1D;
  #interactionBounds?: Bounds;

  #updateAction: UpdateAction = { type: "update" };

  #viewport: Viewport = {
    size: { width: 0, height: 0 },
    bounds: { x: undefined, y: undefined },
  };

  #latestXScale?: Scale;

  #theme: Theme;

  #queueDispatchRender = debouncePromise(async () => {
    await this.#dispatchRender();
  });

  #queueDispatchDatasets = debouncePromise(async () => {
    await this.#dispatchDatasets();
  });

  public constructor(canvas: OffscreenCanvas, builder: IDatasetsBuilder, theme: Theme) {
    super();

    this.#theme = theme;
    this.#datasetsBuilder = builder;
    this.#canvas = canvas;
    this.#renderingWorker = new Worker(
      // foxglove-depcheck-used: babel-plugin-transform-import-meta
      new URL("./ChartRenderer.worker", import.meta.url),
    );

    registry.register(this, this.#renderingWorker);
  }

  public handlePlayerState(state: Immutable<PlayerState>): void {
    const activeData = state.activeData;
    if (!activeData) {
      return;
    }

    const datasetsRange = this.#datasetsBuilder.handlePlayerState(state);

    this.#datasetRange = datasetsRange;
    this.#queueDispatchRender();
  }

  public handleConfig(config: Immutable<PlotConfig>, globalVariables: GlobalVariables): void {
    this.#configBounds = {
      x: {
        max: config.maxXValue,
        min: config.minXValue,
      },
      y: {
        max: config.maxYValue == undefined ? undefined : +config.maxYValue,
        min: config.minYValue == undefined ? undefined : +config.minYValue,
      },
    };

    const referenceLines = filterMap(config.paths, (path, idx) => {
      if (!path.enabled || !isReferenceLinePlotPathType(path)) {
        return;
      }

      const value = +path.value;
      if (isNaN(value)) {
        return;
      }

      return {
        color: getLineColor(path.color, idx),
        value,
      };
    });

    this.#updateAction.showXAxisLabels = config.showXAxisLabels;
    this.#updateAction.showYAxisLabels = config.showYAxisLabels;
    this.#updateAction.referenceLines = referenceLines;

    this.#datasetsBuilder.setConfig(config, globalVariables);
    this.#queueDispatchRender();
  }

  public setTimeseriesBounds(bounds: Immutable<Partial<Bounds1D>>): void {
    this.#timeseriesRange = bounds;
    this.#interactionBounds = undefined;
    this.#queueDispatchRender();
  }

  public setZoomMode(mode: "x" | "xy" | "y"): void {
    this.#updateAction.zoomMode = mode;
    this.#queueDispatchRender();
  }

  public resetBounds(): void {
    this.#interactionBounds = undefined;
    this.#timeseriesRange = undefined;
    this.#queueDispatchRender();
  }

  public setSize(size: { width: number; height: number }): void {
    this.#viewport.size = size;
    this.#updateAction.size = size;
    this.#queueDispatchRender();
  }

  public destroy(): void {
    this.#datasetsBuilder.destroy();
    this.#renderingWorker.terminate();
  }

  public addInteractionEvent(ev: InteractionEvent): void {
    if (!this.#updateAction.interactionEvents) {
      this.#updateAction.interactionEvents = [];
    }
    this.#updateAction.interactionEvents.push(ev);
    this.#queueDispatchRender();
  }

  /** Get the plot x value at the canvas pixel x location */
  public getXValueAtPixel(pixelX: number): number {
    if (!this.#latestXScale) {
      return -1;
    }

    const pixelRange = this.#latestXScale.right - this.#latestXScale.left;
    if (pixelRange <= 0) {
      return -1;
    }

    // Linear interpolation to place the pixelX value within min/max
    return (
      this.#latestXScale.min +
      ((pixelX - this.#latestXScale.left) / pixelRange) *
        (this.#latestXScale.max - this.#latestXScale.min)
    );
  }

  public async getElementsAtPixel(pixel: { x: number; y: number }): Promise<HoverElement[]> {
    const renderer = await this.#rendererInstance();
    return await renderer.getElementsAtPixel(pixel);
  }

  /** Get the entire data for all series */
  public async getCsvData(): Promise<CsvDataset[]> {
    return await this.#datasetsBuilder.getCsvData();
  }

  async #dispatchRender(): Promise<void> {
    const renderer = await this.#rendererInstance();

    const xMin =
      this.#interactionBounds?.x.min ??
      this.#timeseriesRange?.min ??
      this.#configBounds.x.min ??
      this.#datasetRange?.min;
    const xMax =
      this.#interactionBounds?.x.max ??
      this.#timeseriesRange?.max ??
      this.#configBounds.x.max ??
      this.#datasetRange?.max;

    const yMin = this.#interactionBounds?.y.min ?? this.#configBounds.y.min;
    const yMax = this.#interactionBounds?.y.max ?? this.#configBounds.y.max;

    this.#updateAction.range = {
      min: xMin,
      max: xMax,
    };
    this.#updateAction.domain = {
      min: yMin,
      max: yMax,
    };

    const haveInteractionEvents = (this.#updateAction.interactionEvents?.length ?? 0) > 0;

    const action = this.#updateAction;
    this.#updateAction = {
      type: "update",
    };

    const bounds = await renderer.update(action);

    if (haveInteractionEvents) {
      this.#interactionBounds = bounds;
    }

    if (haveInteractionEvents && bounds) {
      this.emit("timeseriesBounds", bounds.x);
    }
    this.#queueDispatchDatasets();
  }

  async #dispatchDatasets(): Promise<void> {
    const minX =
      this.#interactionBounds?.x.min ??
      this.#timeseriesRange?.min ??
      this.#configBounds.x.min ??
      this.#datasetRange?.min;

    const maxX =
      this.#interactionBounds?.x.max ??
      this.#timeseriesRange?.max ??
      this.#configBounds.x.max ??
      this.#datasetRange?.max;
    this.#viewport.bounds.x = {
      min: minX,
      max: maxX,
    };
    this.#viewport.bounds.y = this.#interactionBounds?.y ?? this.#configBounds.y;

    const datasets = await this.#datasetsBuilder.getViewportDatasets(this.#viewport);
    const renderer = await this.#rendererInstance();
    this.#latestXScale = await renderer.updateDatasets(datasets);
    this.emit("xScaleChanged", this.#latestXScale);
  }

  async #rendererInstance(): Promise<Comlink.RemoteObject<ChartRenderer>> {
    if (this.#renderer) {
      return await this.#renderer;
    }

    const remote = Comlink.wrap<Service<Comlink.RemoteObject<ChartRenderer>>>(
      this.#renderingWorker,
    );

    // Set the promise without await so init creates only one instance of renderer even if called
    // twice.
    this.#renderer = remote.init(
      Comlink.transfer(
        {
          canvas: this.#canvas,
          devicePixelRatio: window.devicePixelRatio,
          gridColor: this.#theme.palette.divider,
          tickColor: this.#theme.palette.text.secondary,
        },
        [this.#canvas],
      ),
    );
    return await this.#renderer;
  }
}
