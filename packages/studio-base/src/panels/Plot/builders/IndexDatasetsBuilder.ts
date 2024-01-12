// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { ChartDataset } from "chart.js";

import { filterMap } from "@foxglove/den/collection";
import { toSec, isTime } from "@foxglove/rostime";
import { Immutable, Time } from "@foxglove/studio";
import { RosPath } from "@foxglove/studio-base/components/MessagePathSyntax/constants";
import parseRosPath from "@foxglove/studio-base/components/MessagePathSyntax/parseRosPath";
import { simpleGetMessagePathDataItems } from "@foxglove/studio-base/components/MessagePathSyntax/simpleGetMessagePathDataItems";
import { fillInGlobalVariablesInPath } from "@foxglove/studio-base/components/MessagePathSyntax/useCachedGetMessagePathDataItems";
import { Bounds1D } from "@foxglove/studio-base/components/TimeBasedChart/types";
import { GlobalVariables } from "@foxglove/studio-base/hooks/useGlobalVariables";
import { PlayerState } from "@foxglove/studio-base/players/types";
import { getContrastColor, getLineColor } from "@foxglove/studio-base/util/plotColors";

import { CsvDataset, GetViewportDatasetsResult, IDatasetsBuilder } from "./IDatasetsBuilder";
import { Dataset } from "../ChartRenderer";
import { Datum, OriginalValue, isReferenceLinePlotPathType } from "../internalTypes";
import { mathFunctions } from "../mathFunctions";
import { PlotConfig } from "../types";

type DatumWithReceiveTime = Datum & {
  receiveTime: Time;
};

type SeriesItem = {
  enabled: boolean;
  messagePath: string;
  parsed: RosPath;
  dataset: ChartDataset<"scatter", DatumWithReceiveTime[]>;
};

const emptyPaths = new Set<string>();

export class IndexDatasetsBuilder implements IDatasetsBuilder {
  #seriesByMessagePath = new Map<string, SeriesItem>();

  public handlePlayerState(state: Immutable<PlayerState>): Bounds1D | undefined {
    const activeData = state.activeData;
    if (!activeData) {
      return;
    }

    const msgEvents = activeData.messages;
    if (msgEvents.length === 0) {
      return;
    }

    const range: Bounds1D = { min: 0, max: 0 };
    for (const series of this.#seriesByMessagePath.values()) {
      const mathFn = series.parsed.modifier ? mathFunctions[series.parsed.modifier] : undefined;

      // loop over the events backwards and once we find our first matching topic
      // read that for the path items
      for (let i = msgEvents.length - 1; i >= 0; --i) {
        const msgEvent = msgEvents[i]!;
        if (msgEvent.topic !== series.parsed.topicName) {
          continue;
        }

        const items = simpleGetMessagePathDataItems(msgEvent, series.parsed);
        const pathItems = filterMap(items, (item, idx) => {
          if (!isChartValue(item)) {
            return;
          }

          const chartValue = getChartValue(item);
          const mathModifiedValue =
            mathFn && chartValue != undefined ? mathFn(chartValue) : undefined;
          return {
            x: idx,
            y: chartValue == undefined ? NaN : mathModifiedValue ?? chartValue,
            receiveTime: msgEvent.receiveTime,
            value: mathModifiedValue ?? item,
          };
        });

        series.dataset.data = pathItems;

        break;
      }

      range.max = Math.max(range.max, series.dataset.data.length - 1);
    }

    return range;
  }

  public setConfig(
    config: Immutable<PlotConfig>,
    colorScheme: "light" | "dark",
    globalVariables: GlobalVariables,
  ): void {
    // Make a new map so we drop series which are no longer present
    const newSeries = new Map();

    let idx = 0;
    for (const path of config.paths) {
      if (isReferenceLinePlotPathType(path)) {
        continue;
      }

      const parsed = parseRosPath(path.value);
      if (!parsed) {
        continue;
      }

      const filledParsed = fillInGlobalVariablesInPath(parsed, globalVariables);

      let existingSeries = this.#seriesByMessagePath.get(path.value);
      if (!existingSeries) {
        existingSeries = {
          enabled: path.enabled,
          messagePath: path.value,
          parsed: filledParsed,
          dataset: {
            data: [],
          },
        };
      }

      const color = getLineColor(path.color, idx);
      const lineSize = path.lineSize ?? 1.0;
      const showLine = path.showLine ?? true;

      existingSeries.dataset = {
        ...existingSeries.dataset,
        borderColor: color,
        showLine,
        fill: false,
        borderWidth: lineSize,
        pointRadius: lineSize * 1.2,
        pointHoverRadius: 3,
        pointBackgroundColor: showLine ? getContrastColor(colorScheme, color) : color,
        pointBorderColor: "transparent",
      };

      newSeries.set(path.value, existingSeries);
      idx += 1;
    }
    this.#seriesByMessagePath = newSeries;
  }

  public async getViewportDatasets(): Promise<GetViewportDatasetsResult> {
    const datasets: Dataset[] = [];
    for (const series of this.#seriesByMessagePath.values()) {
      if (!series.enabled) {
        continue;
      }

      datasets.push(series.dataset);
    }

    return { datasets, pathsWithMismatchedDataLengths: emptyPaths };
  }

  public async getCsvData(): Promise<CsvDataset[]> {
    const datasets: CsvDataset[] = [];
    for (const series of this.#seriesByMessagePath.values()) {
      if (!series.enabled) {
        continue;
      }

      datasets.push({
        label: series.messagePath,
        data: series.dataset.data,
      });
    }

    return datasets;
  }

  public destroy(): void {
    // no-op this builder does not use a worker
  }
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
