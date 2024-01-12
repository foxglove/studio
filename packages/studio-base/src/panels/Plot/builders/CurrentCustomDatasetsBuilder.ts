// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { ChartDataset } from "chart.js";
import * as _ from "lodash-es";

import { filterMap } from "@foxglove/den/collection";
import { Immutable, Time, MessageEvent } from "@foxglove/studio";
import { RosPath } from "@foxglove/studio-base/components/MessagePathSyntax/constants";
import parseRosPath from "@foxglove/studio-base/components/MessagePathSyntax/parseRosPath";
import { simpleGetMessagePathDataItems } from "@foxglove/studio-base/components/MessagePathSyntax/simpleGetMessagePathDataItems";
import { fillInGlobalVariablesInPath } from "@foxglove/studio-base/components/MessagePathSyntax/useCachedGetMessagePathDataItems";
import { Bounds1D } from "@foxglove/studio-base/components/TimeBasedChart/types";
import { GlobalVariables } from "@foxglove/studio-base/hooks/useGlobalVariables";
import { PlayerState } from "@foxglove/studio-base/players/types";
import { getLineColor, getContrastColor } from "@foxglove/studio-base/util/plotColors";

import { CsvDataset, GetViewportDatasetsResult, IDatasetsBuilder } from "./IDatasetsBuilder";
import { Dataset } from "../ChartRenderer";
import { isReferenceLinePlotPathType, PlotConfig } from "../config";
import { getChartValue, isChartValue, Datum } from "../datum";
import { mathFunctions } from "../mathFunctions";

type DatumWithReceiveTime = Datum & {
  receiveTime: Time;
};

type SeriesItem = {
  enabled: boolean;
  messagePath: string;
  parsed: RosPath;
  dataset: ChartDataset<"scatter", DatumWithReceiveTime[]>;
};

export class CurrentCustomDatasetsBuilder implements IDatasetsBuilder {
  #xParsedPath?: Immutable<RosPath>;

  #xValues: number[] = [];

  #seriesByMessagePath = new Map<string, SeriesItem>();
  #pathsWithMismatchedDataLengths = new Set<string>();

  public handlePlayerState(state: Immutable<PlayerState>): Bounds1D | undefined {
    const activeData = state.activeData;
    if (!activeData || !this.#xParsedPath) {
      return;
    }

    const msgEvents = activeData.messages;
    if (msgEvents.length === 0) {
      return;
    }

    {
      const xAxisMathFn =
        (this.#xParsedPath.modifier ? mathFunctions[this.#xParsedPath.modifier] : undefined) ??
        _.identity<number>;

      const msgEvent = lastMatchingTopic(msgEvents, this.#xParsedPath.topicName);
      if (msgEvent) {
        const items = simpleGetMessagePathDataItems(msgEvent, this.#xParsedPath);

        this.#xValues = [];
        for (const item of items) {
          if (!isChartValue(item)) {
            continue;
          }

          const chartValue = getChartValue(item);
          if (chartValue == undefined) {
            continue;
          }

          this.#xValues.push(xAxisMathFn(chartValue));
        }
      }
    }

    for (const series of this.#seriesByMessagePath.values()) {
      const mathFn = series.parsed.modifier ? mathFunctions[series.parsed.modifier] : undefined;

      const msgEvent = lastMatchingTopic(msgEvents, series.parsed.topicName);
      if (!msgEvent) {
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
          x: this.#xValues[idx] ?? NaN,
          y: chartValue == undefined ? NaN : mathModifiedValue ?? chartValue,
          receiveTime: msgEvent.receiveTime,
          value: mathModifiedValue ?? item,
        };
      });

      if (pathItems.length === this.#xValues.length) {
        this.#pathsWithMismatchedDataLengths.delete(series.messagePath);
      } else {
        this.#pathsWithMismatchedDataLengths.add(series.messagePath);
      }

      series.dataset.data = pathItems;
    }

    // Returning undefined means we allow the chart to determine the bounds and don't need to
    // provide the dataset bounds.
    return undefined;
  }

  public setXPath(path: Immutable<RosPath> | undefined): void {
    if (JSON.stringify(path) === JSON.stringify(this.#xParsedPath)) {
      return;
    }

    // When the x-path changes we clear any existing data from the datasets
    this.#xParsedPath = path;
    for (const series of this.#seriesByMessagePath.values()) {
      series.dataset.data = [];
    }
    this.#pathsWithMismatchedDataLengths.clear();
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

    return { datasets, pathsWithMismatchedDataLengths: this.#pathsWithMismatchedDataLengths };
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

function lastMatchingTopic(msgEvents: Immutable<MessageEvent[]>, topic: string) {
  for (let i = msgEvents.length - 1; i >= 0; --i) {
    const msgEvent = msgEvents[i]!;
    if (msgEvent.topic === topic) {
      return msgEvent;
    }
  }

  return undefined;
}
