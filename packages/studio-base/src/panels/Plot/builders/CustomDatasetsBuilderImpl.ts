// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as _ from "lodash-es";

import { compare } from "@foxglove/rostime";
import { Immutable, Time } from "@foxglove/studio";
import { RosPath } from "@foxglove/studio-base/components/MessagePathSyntax/constants";
import { downsampleScatter } from "@foxglove/studio-base/components/TimeBasedChart/downsample";
import { Bounds1D } from "@foxglove/studio-base/components/TimeBasedChart/types";
import { extendBounds1D } from "@foxglove/studio-base/types/Bounds";
import { TimestampMethod } from "@foxglove/studio-base/util/time";

import { CsvDataset, GetViewportDatasetsResult, Viewport } from "./IDatasetsBuilder";
import type { Dataset } from "../ChartRenderer";
import { Datum, OriginalValue } from "../internalTypes";

export type ValueItem = {
  value: number;
  originalValue: OriginalValue;
  receiveTime: Time;
};

/**
 * Identifier used to determine whether previous data can be reused when the config changes.
 * Compare with deep equality.
 */
export type SeriesConfigKey = {
  path: Immutable<RosPath>;
  timestampMethod: TimestampMethod;
};

export type SeriesConfig = {
  key: SeriesConfigKey;
  messagePath: string;
  color: string;
  /** Used for points when lines are also shown to provide extra contrast */
  contrastColor: string;
  showLine: boolean;
  lineSize: number;
  enabled: boolean;
};

type FullDatum = Datum & {
  receiveTime: Time;
  index: number;
};

type Series = {
  config: SeriesConfig;
  current: ValueItem[];
  full: ValueItem[];
};

type ResetSeriesFullAction = {
  type: "reset-full";
  series: string;
};

type ResetSeriesCurrentAction = {
  type: "reset-current";
  series: string;
};

type ResetCurrentXAction = {
  type: "reset-current-x";
};

type ResetFullXAction = {
  type: "reset-full-x";
};

type UpdateCurrentXAction = {
  type: "append-current-x";
  items: ValueItem[];
};

type UpdateFullXAction = {
  type: "append-full-x";
  items: ValueItem[];
};

type UpdateSeriesCurrentAction = {
  type: "append-current";
  series: string;
  items: ValueItem[];
};

type UpdateSeriesFullAction = {
  type: "append-full";
  series: string;
  items: ValueItem[];
};

export type UpdateDataAction =
  | ResetSeriesFullAction
  | ResetSeriesCurrentAction
  | ResetCurrentXAction
  | ResetFullXAction
  | UpdateCurrentXAction
  | UpdateFullXAction
  | UpdateSeriesCurrentAction
  | UpdateSeriesFullAction;

// When accumulating datums into the current buffer we cap each series to this number of datums so
// we do not grow the memory for accumulated current data indefinitely
const MAX_CURRENT_DATUMS_PER_SERIES = 50_000;

export class CustomDatasetsBuilderImpl {
  #xValues: { current: ValueItem[]; full: ValueItem[] } = {
    current: [],
    full: [],
  };
  #seriesByMessagePath = new Map<string, Series>();

  public updateData(actions: Immutable<UpdateDataAction[]>): void {
    for (const action of actions) {
      this.#applyAction(action);
    }
  }

  public setConfig(seriesConfig: Immutable<SeriesConfig[]>): void {
    // Make a new map so we drop series which are no longer present
    const newSeries = new Map();

    for (const config of seriesConfig) {
      let existingSeries = this.#seriesByMessagePath.get(config.messagePath);
      if (!existingSeries || !_.isEqual(existingSeries.config.key, config.key)) {
        existingSeries = {
          config,
          current: [],
          full: [],
        };
      }
      newSeries.set(config.messagePath, existingSeries);
      existingSeries.config = config;
    }
    this.#seriesByMessagePath = newSeries;
  }

  public getViewportDatasets(viewport: Immutable<Viewport>): GetViewportDatasetsResult {
    const datasets: Dataset[] = [];
    const pathsWithMismatchedDataLengths = new Set<string>();
    for (const series of this.#seriesByMessagePath.values()) {
      if (!series.config.enabled) {
        continue;
      }

      const { showLine, color, contrastColor } = series.config;
      const dataset: Dataset = {
        borderColor: color,
        showLine,
        fill: false,
        borderWidth: series.config.lineSize,
        pointRadius: series.config.lineSize * 1.2,
        pointHoverRadius: 3,
        pointBackgroundColor: showLine ? contrastColor : color,
        pointBorderColor: "transparent",
        data: [],
      };

      // Create the full dataset by pairing full y-values with their x-value peers
      // And then pairing current y-values with their x-value peers

      const allData: FullDatum[] = [];

      const xBounds: Bounds1D = { min: Number.MAX_VALUE, max: Number.MIN_VALUE };
      const yBounds: Bounds1D = { min: Number.MAX_VALUE, max: Number.MIN_VALUE };

      for (let idx = 0; idx < series.full.length && idx < this.#xValues.full.length; ++idx) {
        const xValue = this.#xValues.full[idx];
        const yValue = series.full[idx];
        if (xValue == undefined || yValue == undefined) {
          continue;
        }

        allData.push({
          x: xValue.value,
          y: yValue.value,
          index: idx,
          receiveTime: xValue.receiveTime,
          value: yValue.originalValue,
        });

        extendBounds1D(xBounds, xValue.value);
        extendBounds1D(yBounds, yValue.value);
      }

      const fullLength = allData.length;
      for (let idx = 0; idx < series.current.length && idx < this.#xValues.current.length; ++idx) {
        const xValue = this.#xValues.current[idx];
        const yValue = series.current[idx];
        if (xValue == undefined || yValue == undefined) {
          continue;
        }

        allData.push({
          x: xValue.value,
          y: yValue.value,
          index: idx + fullLength,
          receiveTime: xValue.receiveTime,
          value: yValue.originalValue,
        });

        extendBounds1D(xBounds, xValue.value);
        extendBounds1D(yBounds, yValue.value);
      }

      // Downsample scatter is designed for scatter plots without points since it culls values
      // outside of the viewport and these are needed when connecting the points with lines.
      if (dataset.showLine === true) {
        for (const item of allData) {
          dataset.data.push({
            x: item.x,
            y: item.y,
            value: item.value,
          });
        }
      } else {
        const downsampleViewport = {
          width: viewport.size.width,
          height: viewport.size.height,
          bounds: {
            x: {
              min: viewport.bounds.x?.min ?? xBounds.min,
              max: viewport.bounds.x?.max ?? xBounds.max,
            },
            y: {
              min: viewport.bounds.y?.min ?? yBounds.min,
              max: viewport.bounds.y?.max ?? yBounds.max,
            },
          },
        };

        const downsampledIndicies = downsampleScatter(allData, downsampleViewport);

        for (const index of downsampledIndicies) {
          const item = allData[index];
          if (!item) {
            continue;
          }

          dataset.data.push({
            x: item.x,
            y: item.y,
            value: item.value,
          });
        }
      }

      datasets.push(dataset);

      if (
        this.#xValues.full.length !== series.full.length ||
        this.#xValues.current.length !== series.current.length
      ) {
        pathsWithMismatchedDataLengths.add(series.config.messagePath);
      }
    }

    return { datasets, pathsWithMismatchedDataLengths };
  }

  public getCsvData(): CsvDataset[] {
    const datasets: CsvDataset[] = [];
    for (const series of this.#seriesByMessagePath.values()) {
      if (!series.config.enabled) {
        continue;
      }

      const allData: FullDatum[] = [];

      for (let idx = 0; idx < series.full.length && idx < this.#xValues.full.length; ++idx) {
        const xValue = this.#xValues.full[idx];
        const yValue = series.full[idx];
        if (xValue == undefined || yValue == undefined) {
          continue;
        }

        allData.push({
          x: xValue.value,
          y: yValue.value,
          index: idx,
          receiveTime: xValue.receiveTime,
          value: yValue.originalValue,
        });
      }

      const fullLength = allData.length;
      for (let idx = 0; idx < series.current.length && idx < this.#xValues.current.length; ++idx) {
        const xValue = this.#xValues.current[idx];
        const yValue = series.current[idx];
        if (xValue == undefined || yValue == undefined) {
          continue;
        }

        allData.push({
          x: xValue.value,
          y: yValue.value,
          index: idx + fullLength,
          receiveTime: xValue.receiveTime,
          value: yValue.originalValue,
        });
      }

      datasets.push({
        label: series.config.messagePath,
        data: allData,
      });
    }

    return datasets;
  }

  #applyAction(action: Immutable<UpdateDataAction>): void {
    switch (action.type) {
      case "reset-current-x": {
        this.#xValues.current = [];
        break;
      }
      case "reset-full-x": {
        this.#xValues.full = [];
        break;
      }
      case "reset-current": {
        const series = this.#seriesByMessagePath.get(action.series);
        if (!series) {
          return;
        }
        // when we reset current we make a new array since we'll assume the full will load
        // we won't need to keep getting current data
        series.current = [];
        break;
      }
      case "reset-full": {
        const series = this.#seriesByMessagePath.get(action.series);
        if (!series) {
          return;
        }
        // splice to keep underlying memory since we typically expect to fill it again
        series.full.splice(0, series.full.length);
        break;
      }
      case "append-current-x": {
        const lastFullReceiveTime = this.#xValues.full[this.#xValues.full.length - 1]?.receiveTime;

        // Limit the total current datums so they do not grow indefinitely
        const cullSize = Math.max(
          0,
          this.#xValues.current.length + action.items.length - MAX_CURRENT_DATUMS_PER_SERIES,
        );
        this.#xValues.current.splice(0, cullSize);

        for (const item of action.items) {
          if (lastFullReceiveTime && compare(item.receiveTime, lastFullReceiveTime) <= 0) {
            continue;
          }

          this.#xValues.current.push(item);
        }
        break;
      }
      case "append-full-x": {
        this.#xValues.full.push(...action.items);

        // trim current data to remove values present in the full data
        const lastFullReceiveTime = this.#xValues.full[this.#xValues.full.length - 1]?.receiveTime;
        if (lastFullReceiveTime) {
          let idx = 0;
          for (const item of this.#xValues.current) {
            if (compare(item.receiveTime, lastFullReceiveTime) > 0) {
              break;
            }
            idx += 1;
          }

          if (idx > 0) {
            this.#xValues.current.splice(0, idx);
          }
        }
        break;
      }
      case "append-current": {
        const series = this.#seriesByMessagePath.get(action.series);
        if (!series) {
          return;
        }

        // Limit the total current datums so they do not grow indefinitely
        const cullSize = Math.max(
          0,
          series.current.length + action.items.length - MAX_CURRENT_DATUMS_PER_SERIES,
        );
        series.current.splice(0, cullSize);

        const lastFullReceiveTime = series.full[series.full.length - 1]?.receiveTime;
        for (const item of action.items) {
          if (lastFullReceiveTime && compare(item.receiveTime, lastFullReceiveTime) <= 0) {
            continue;
          }

          series.current.push(item);
        }

        break;
      }
      case "append-full": {
        const series = this.#seriesByMessagePath.get(action.series);
        if (!series) {
          return;
        }

        series.full.push(...action.items);

        // trim current data to remove values present in the full data
        const lastFullReceiveTime = series.full[series.full.length - 1]?.receiveTime;
        if (lastFullReceiveTime) {
          let idx = 0;
          for (const item of series.current) {
            if (compare(item.receiveTime, lastFullReceiveTime) > 0) {
              break;
            }
            idx += 1;
          }

          if (idx > 0) {
            series.current.splice(0, idx);
          }
        }
      }
    }
  }
}
