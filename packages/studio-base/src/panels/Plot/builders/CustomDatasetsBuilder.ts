// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as Comlink from "comlink";

import { filterMap } from "@foxglove/den/collection";
import { toSec, isTime } from "@foxglove/rostime";
import { Immutable, MessageEvent } from "@foxglove/studio";
import { RosPath } from "@foxglove/studio-base/components/MessagePathSyntax/constants";
import parseRosPath from "@foxglove/studio-base/components/MessagePathSyntax/parseRosPath";
import { simpleGetMessagePathDataItems } from "@foxglove/studio-base/components/MessagePathSyntax/simpleGetMessagePathDataItems";
import { fillInGlobalVariablesInPath } from "@foxglove/studio-base/components/MessagePathSyntax/useCachedGetMessagePathDataItems";
import { Bounds1D } from "@foxglove/studio-base/components/TimeBasedChart/types";
import { GlobalVariables } from "@foxglove/studio-base/hooks/useGlobalVariables";
import { PlayerState } from "@foxglove/studio-base/players/types";
import { unionBounds1D } from "@foxglove/studio-base/types/Bounds";
import { getLineColor } from "@foxglove/studio-base/util/plotColors";
import { TimestampMethod } from "@foxglove/studio-base/util/time";

import { BlockTopicCursor } from "./BlockTopicCursor";
import {
  CustomDatasetsBuilderImpl,
  UpdateDataAction,
  ValueItem,
} from "./CustomDatasetsBuilderImpl";
import { CsvDataset, IDatasetsBuilder, Viewport } from "./IDatasetsBuilder";
import { Dataset } from "../ChartRenderer";
import { isReferenceLinePlotPathType } from "../internalTypes";
import { PlotConfig } from "../types";

type SeriesItem = {
  key: string;
  messagePath: string;
  parsed: RosPath;
  color: string;
  timestampMethod: TimestampMethod;
  showLine: boolean;
  lineSize: number;
  enabled: boolean;
  blockCursor: BlockTopicCursor;
};

// If the datasets builder is garbage collected we also need to cleanup the worker
// This registry ensures the worker is cleaned up when the builder is garbage collected
const registry = new FinalizationRegistry<Worker>((worker) => {
  worker.terminate();
});

export class CustomDatasetsBuilder implements IDatasetsBuilder {
  #parsedPath?: Immutable<RosPath>;
  #xValuesCursor?: BlockTopicCursor;

  #datasetsBuilderWorker: Worker;
  #datasetsBuilderRemote: Comlink.Remote<Comlink.RemoteObject<CustomDatasetsBuilderImpl>>;

  #pendingDataDispatch: Immutable<UpdateDataAction>[] = [];

  #lastSeekTime = 0;

  #seriesConfigs: SeriesItem[] = [];

  #xCurrentBounds?: Bounds1D;
  #xFullBounds?: Bounds1D;

  public constructor() {
    this.#datasetsBuilderWorker = new Worker(
      // foxglove-depcheck-used: babel-plugin-transform-import-meta
      new URL("./CustomDatasetsBuilderImpl.worker", import.meta.url),
    );
    this.#datasetsBuilderRemote = Comlink.wrap(this.#datasetsBuilderWorker);

    registry.register(this, this.#datasetsBuilderWorker);
  }

  public handlePlayerState(state: Immutable<PlayerState>): Bounds1D | undefined {
    const activeData = state.activeData;
    if (!activeData) {
      return;
    }

    const didSeek = activeData.lastSeekTime !== this.#lastSeekTime;
    this.#lastSeekTime = activeData.lastSeekTime;

    const msgEvents = activeData.messages;
    if (msgEvents.length > 0) {
      if (didSeek) {
        this.#pendingDataDispatch.push({
          type: "reset-current-x",
        });
        this.#xCurrentBounds = undefined;
      }

      // Read the x-axis values
      if (this.#parsedPath) {
        const pathItems = readMessagePathItems(msgEvents, this.#parsedPath);

        this.#pendingDataDispatch.push({
          type: "append-current-x",
          items: pathItems,
        });

        if (pathItems.length > 0) {
          this.#xCurrentBounds = computeBounds(this.#xCurrentBounds, pathItems);
        }
      }

      for (const seriesConfig of this.#seriesConfigs) {
        if (didSeek) {
          this.#pendingDataDispatch.push({
            type: "reset-current",
            series: seriesConfig.messagePath,
          });
        }

        const pathItems = readMessagePathItems(msgEvents, seriesConfig.parsed);
        this.#pendingDataDispatch.push({
          type: "append-current",
          series: seriesConfig.messagePath,
          items: pathItems,
        });
      }
    }

    const blocks = state.progress.messageCache?.blocks;
    if (blocks) {
      if (this.#xValuesCursor && this.#parsedPath) {
        if (this.#xValuesCursor.nextWillReset(blocks)) {
          this.#pendingDataDispatch.push({
            type: "reset-full-x",
          });
        }

        let messageEvents = undefined;
        while ((messageEvents = this.#xValuesCursor.next(blocks)) != undefined) {
          const pathItems = readMessagePathItems(messageEvents, this.#parsedPath);

          this.#pendingDataDispatch.push({
            type: "append-full-x",
            items: pathItems,
          });

          if (pathItems.length > 0) {
            this.#xFullBounds = computeBounds(this.#xFullBounds, pathItems);
          }
        }
      }

      for (const seriesConfig of this.#seriesConfigs) {
        if (seriesConfig.blockCursor.nextWillReset(blocks)) {
          this.#pendingDataDispatch.push({
            type: "reset-full",
            series: seriesConfig.messagePath,
          });
        }

        let messageEvents = undefined;
        while ((messageEvents = seriesConfig.blockCursor.next(blocks)) != undefined) {
          const pathItems = readMessagePathItems(messageEvents, seriesConfig.parsed);

          this.#pendingDataDispatch.push({
            type: "append-full",
            series: seriesConfig.messagePath,
            items: pathItems,
          });
        }
      }
    }

    if (!this.#xCurrentBounds) {
      return this.#xFullBounds ?? { min: 0, max: 1 };
    }

    if (!this.#xFullBounds) {
      return this.#xCurrentBounds;
    }

    return unionBounds1D(this.#xCurrentBounds, this.#xFullBounds);
  }

  public setXPath(path: Immutable<RosPath> | undefined): void {
    if (JSON.stringify(path) === JSON.stringify(this.#parsedPath)) {
      return;
    }

    this.#parsedPath = path;
    if (this.#parsedPath) {
      this.#xValuesCursor = new BlockTopicCursor(this.#parsedPath.topicName);
    } else {
      this.#xValuesCursor = undefined;
    }

    this.#pendingDataDispatch.push({
      type: "reset-current-x",
    });

    this.#pendingDataDispatch.push({
      type: "reset-full-x",
    });
  }

  public setConfig(config: Immutable<PlotConfig>, globalVariables: GlobalVariables): void {
    this.#seriesConfigs = filterMap(config.paths, (path, idx) => {
      if (isReferenceLinePlotPathType(path)) {
        return;
      }

      const parsed = parseRosPath(path.value);
      if (!parsed) {
        return;
      }

      const filledParsed = fillInGlobalVariablesInPath(parsed, globalVariables);

      // When global variables change the path.value is still the original value with the variable
      // names But we need to consider this as a new series (new block cursor) so we compute new
      // values when variables cause the resolved path value to update.
      //
      // We also want to re-compute values when the timestamp method changes. So we use a _key_ that
      // is the filled path and the timestamp method. If either change, we consider this a new
      // series.
      const key = (JSON.stringify(filledParsed) as unknown as string) + path.timestampMethod;

      // It is important to keep the existing block cursor for the same series to avoid re-processing
      // the blocks again when the series remains.
      const existing = this.#seriesConfigs.find((item) => item.key === key);

      return {
        key,
        messagePath: path.value,
        parsed: filledParsed,
        color: getLineColor(path.color, idx),
        lineSize: path.lineSize ?? 1.0,
        timestampMethod: path.timestampMethod,
        showLine: path.showLine ?? true,
        enabled: path.enabled,
        blockCursor: existing?.blockCursor ?? new BlockTopicCursor(parsed.topicName),
      };
    });

    void this.#datasetsBuilderRemote.setConfig(this.#seriesConfigs);
  }

  public async getViewportDatasets(viewport: Immutable<Viewport>): Promise<Dataset[]> {
    const dispatch = this.#pendingDataDispatch;
    if (dispatch.length > 0) {
      this.#pendingDataDispatch = [];
      await this.#datasetsBuilderRemote.updateData(dispatch);
    }

    return await this.#datasetsBuilderRemote.getViewportDatasets(viewport);
  }

  public async getCsvData(): Promise<CsvDataset[]> {
    return await this.#datasetsBuilderRemote.getCsvData();
  }

  public destroy(): void {
    this.#datasetsBuilderWorker.terminate();
  }
}

function readMessagePathItems(
  events: Immutable<MessageEvent[]>,
  path: Immutable<RosPath>,
): ValueItem[] {
  const out = [];
  for (const event of events) {
    if (event.topic !== path.topicName) {
      continue;
    }

    const items = simpleGetMessagePathDataItems(event, path);
    for (const item of items) {
      const chartValue = getChartValue(item);
      if (chartValue == undefined) {
        continue;
      }

      out.push({
        value: chartValue,
        receiveTime: event.receiveTime,
      });
    }
  }

  return out;
}

function getChartValue(value: unknown): number | undefined {
  switch (typeof value) {
    case "bigint":
      return Number(value);
    case "boolean":
      return Number(value);
    case "number":
      return value;
    case "object":
      if (isTime(value)) {
        return toSec(value);
      }
      return undefined;
    case "string":
      return +value;
    default:
      return undefined;
  }
}

function accumulateBounds(acc: Bounds1D, item: Immutable<ValueItem>) {
  acc.max = Math.max(acc.max, item.value);
  acc.min = Math.min(acc.min, item.value);
  return acc;
}

function computeBounds(
  currentBounds: Immutable<Bounds1D> | undefined,
  items: Immutable<ValueItem[]>,
): Bounds1D {
  const itemBounds = items.reduce(accumulateBounds, {
    min: Number.MAX_VALUE,
    max: Number.MIN_VALUE,
  });

  return unionBounds1D(
    currentBounds ?? { min: Number.MAX_VALUE, max: Number.MIN_VALUE },
    itemBounds,
  );
}
