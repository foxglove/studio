// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as Comlink from "comlink";

import { filterMap } from "@foxglove/den/collection";
import { toSec, subtract as subtractTime, isTime } from "@foxglove/rostime";
import { Immutable, MessageEvent, Time } from "@foxglove/studio";
import { RosPath } from "@foxglove/studio-base/components/MessagePathSyntax/constants";
import parseRosPath from "@foxglove/studio-base/components/MessagePathSyntax/parseRosPath";
import { simpleGetMessagePathDataItems } from "@foxglove/studio-base/components/MessagePathSyntax/simpleGetMessagePathDataItems";
import { stringifyRosPath } from "@foxglove/studio-base/components/MessagePathSyntax/stringifyRosPath";
import { fillInGlobalVariablesInPath } from "@foxglove/studio-base/components/MessagePathSyntax/useCachedGetMessagePathDataItems";
import { Bounds1D } from "@foxglove/studio-base/components/TimeBasedChart/types";
import { GlobalVariables } from "@foxglove/studio-base/hooks/useGlobalVariables";
import { PlayerState } from "@foxglove/studio-base/players/types";
import { getContrastColor, getLineColor } from "@foxglove/studio-base/util/plotColors";
import { TimestampMethod, getTimestampForMessage } from "@foxglove/studio-base/util/time";

import { BlockTopicCursor } from "./BlockTopicCursor";
import {
  CsvDataset,
  GetViewportDatasetsResult,
  IDatasetsBuilder,
  Viewport,
} from "./IDatasetsBuilder";
import type {
  DataItem,
  TimeseriesDatasetsBuilderImpl,
  UpdateDataAction,
  SeriesConfigKey,
} from "./TimeseriesDatasetsBuilderImpl";
import { OriginalValue, isReferenceLinePlotPathType } from "../internalTypes";
import { MathFunction, mathFunctions } from "../mathFunctions";
import { PlotConfig } from "../types";

type SeriesItem = {
  key: SeriesConfigKey;
  messagePath: string;
  parsed: RosPath;
  color: string;
  /** Used for points when lines are also shown to provide extra contrast */
  contrastColor: string;
  timestampMethod: TimestampMethod;
  showLine: boolean;
  lineSize: number;
  enabled: boolean;
  derivative: boolean;
  blockCursor: BlockTopicCursor;
};

// If the datasets builder is garbage collected we also need to cleanup the worker
// This registry ensures the worker is cleaned up when the builder is garbage collected
const registry = new FinalizationRegistry<Worker>((worker) => {
  worker.terminate();
});

const emptyPaths = new Set<string>();

export class TimeseriesDatasetsBuilder implements IDatasetsBuilder {
  #datasetsBuilderWorker: Worker;
  #datasetsBuilderRemote: Comlink.Remote<Comlink.RemoteObject<TimeseriesDatasetsBuilderImpl>>;

  #pendingDataDispatch: Immutable<UpdateDataAction>[] = [];

  #lastSeekTime = 0;

  #seriesConfigs: Immutable<SeriesItem[]> = [];

  public constructor() {
    this.#datasetsBuilderWorker = new Worker(
      // foxglove-depcheck-used: babel-plugin-transform-import-meta
      new URL("./TimeseriesDatasetsBuilderImpl.worker", import.meta.url),
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
      for (const seriesConfig of this.#seriesConfigs) {
        const mathFn = seriesConfig.parsed.modifier
          ? mathFunctions[seriesConfig.parsed.modifier]
          : undefined;

        if (didSeek) {
          this.#pendingDataDispatch.push({
            type: "reset-current",
            series: seriesConfig.key,
          });
        }

        const pathItems = readMessagePathItems(
          msgEvents,
          seriesConfig.parsed,
          seriesConfig.timestampMethod,
          activeData.startTime,
          mathFn,
        );

        this.#pendingDataDispatch.push({
          type: "append-current",
          series: seriesConfig.key,
          items: pathItems,
        });
      }
    }

    const blocks = state.progress.messageCache?.blocks;
    if (blocks) {
      for (const seriesConfig of this.#seriesConfigs) {
        const mathFn = seriesConfig.parsed.modifier
          ? mathFunctions[seriesConfig.parsed.modifier]
          : undefined;

        if (seriesConfig.blockCursor.nextWillReset(blocks)) {
          this.#pendingDataDispatch.push({
            type: "reset-full",
            series: seriesConfig.key,
          });
        }

        let messageEvents = undefined;
        while ((messageEvents = seriesConfig.blockCursor.next(blocks)) != undefined) {
          const pathItems = readMessagePathItems(
            messageEvents,
            seriesConfig.parsed,
            seriesConfig.timestampMethod,
            activeData.startTime,
            mathFn,
          );

          this.#pendingDataDispatch.push({
            type: "append-full",
            series: seriesConfig.key,
            items: pathItems,
          });
        }
      }
    }

    const max = toSec(subtractTime(activeData.endTime, activeData.startTime));
    const min = 0;

    return { min, max };
  }

  public setConfig(
    config: Immutable<PlotConfig>,
    colorScheme: "light" | "dark",
    globalVariables: GlobalVariables,
  ): void {
    this.#seriesConfigs = filterMap(
      config.paths,
      (path, idx): Immutable<SeriesItem> | undefined => {
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
        //
        // This key lets us treat series with the same name but different timestamp methods as distinct
        // using a key instead of the path index lets us preserve loaded data when a path is removed
        const key = `${path.timestampMethod}:${stringifyRosPath(filledParsed)}` as SeriesConfigKey;

        // It is important to keep the existing block cursor for the same series to avoid re-processing
        // the blocks again when the series remains.
        const existing = this.#seriesConfigs.find((item) => item.key === key);
        const color = getLineColor(path.color, idx);
        return {
          key,
          messagePath: path.value,
          parsed: filledParsed,
          color,
          contrastColor: getContrastColor(colorScheme, color),
          lineSize: path.lineSize ?? 1.0,
          timestampMethod: path.timestampMethod,
          showLine: path.showLine ?? true,
          enabled: path.enabled,
          derivative: filledParsed.modifier === "derivative",
          blockCursor: existing?.blockCursor ?? new BlockTopicCursor(parsed.topicName),
        };
      },
    );

    void this.#datasetsBuilderRemote.setConfig(this.#seriesConfigs);
  }

  public async getViewportDatasets(
    viewport: Immutable<Viewport>,
  ): Promise<GetViewportDatasetsResult> {
    const dispatch = this.#pendingDataDispatch;
    if (dispatch.length > 0) {
      this.#pendingDataDispatch = [];
      await this.#datasetsBuilderRemote.updateData(dispatch);
    }

    const datasets = await this.#datasetsBuilderRemote.getViewportDatasets(viewport);
    return { datasets, pathsWithMismatchedDataLengths: emptyPaths };
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
  timestampMethod: TimestampMethod,
  startTime: Immutable<Time>,
  mathFunction?: MathFunction,
): DataItem[] {
  const out = [];
  for (const event of events) {
    if (event.topic !== path.topicName) {
      continue;
    }

    const items = simpleGetMessagePathDataItems(event, path);
    for (const item of items) {
      if (!isChartValue(item)) {
        continue;
      }
      const chartValue = getChartValue(item);
      if (chartValue == undefined) {
        continue;
      }

      const headerStamp = getTimestampForMessage(event.message);
      const timestamp = timestampMethod === "receiveTime" ? event.receiveTime : headerStamp;
      if (!timestamp) {
        continue;
      }

      const xValue = toSec(subtractTime(timestamp, startTime));
      const mathModified = mathFunction ? mathFunction(chartValue) : chartValue;
      out.push({
        x: xValue,
        y: mathModified,
        receiveTime: event.receiveTime,
        headerStamp,
        value: mathFunction ? mathModified : item,
      });
    }
  }

  return out;
}

function isChartValue(value: unknown): value is OriginalValue {
  switch (typeof value) {
    case "bigint":
    case "boolean":
    case "number":
    case "string":
      return true;
    case "object":
      if (isTime(value)) {
        return true;
      }
      return false;
    default:
      return false;
  }
  return false;
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
