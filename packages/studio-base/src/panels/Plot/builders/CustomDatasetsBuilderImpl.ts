// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as _ from "lodash-es";

import { compare } from "@foxglove/rostime";
import { Immutable, Time } from "@foxglove/studio";
import { RosPath } from "@foxglove/studio-base/components/MessagePathSyntax/constants";
import { downsampleScatter } from "@foxglove/studio-base/components/TimeBasedChart/downsample";
import { Bounds1D } from "@foxglove/studio-base/components/TimeBasedChart/types";
import { TimestampMethod } from "@foxglove/studio-base/util/time";

import { CsvDataset, Viewport } from "./IDatasetsBuilder";
import type { Dataset, Datum } from "../ChartRenderer";

export type ValueItem = {
  value: number;
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

  public getViewportDatasets(viewport: Immutable<Viewport>): Dataset[] {
    const datasets: Dataset[] = [];
    for (const series of this.#seriesByMessagePath.values()) {
      if (!series.config.enabled) {
        continue;
      }

      const dataset: Dataset = {
        borderColor: series.config.color,
        showLine: series.config.showLine,
        fill: false,
        borderWidth: series.config.lineSize,
        pointRadius: series.config.lineSize * 1.2,
        pointHoverRadius: 3,
        pointBackgroundColor: series.config.color,
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
        });

        xBounds.min = Math.min(xBounds.min, xValue.value);
        xBounds.max = Math.max(xBounds.max, xValue.value);
        yBounds.min = Math.min(yBounds.min, yValue.value);
        yBounds.max = Math.max(yBounds.max, yValue.value);
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
        });

        xBounds.min = Math.min(xBounds.min, xValue.value);
        xBounds.max = Math.max(xBounds.max, xValue.value);
        yBounds.min = Math.min(yBounds.min, yValue.value);
        yBounds.max = Math.max(yBounds.max, yValue.value);
      }

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

      // When a series is downsampled the points are disabled as a visual indicator that
      // data is downsampled.
      //
      // If show line is false then we must show points otherwise nothing will be displayed
      if (downsampledIndicies.length < allData.length && dataset.showLine === true) {
        dataset.pointRadius = 0;
      }

      for (const index of downsampledIndicies) {
        const item = allData[index];
        if (!item) {
          continue;
        }

        dataset.data.push({
          x: item.x,
          y: item.y,
        });
      }

      datasets.push(dataset);
    }

    return datasets;
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
        const lastFullReceiveTime = this.#xValues.full[this.#xValues.full.length]?.receiveTime;

        for (const item of action.items) {
          if (
            lastFullReceiveTime != undefined &&
            compare(item.receiveTime, lastFullReceiveTime) <= 0
          ) {
            continue;
          }

          this.#xValues.current.push(item);
        }
        break;
      }
      case "append-full-x": {
        this.#xValues.full.push(...action.items);

        // trim current data to remove values present in the full data
        const lastFullReceiveTime = this.#xValues.full[this.#xValues.full.length]?.receiveTime;
        if (lastFullReceiveTime != undefined) {
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

        const lastFullReceiveTime = series.full[series.full.length]?.receiveTime;

        for (const item of action.items) {
          if (
            lastFullReceiveTime != undefined &&
            compare(item.receiveTime, lastFullReceiveTime) <= 0
          ) {
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
        if (lastFullReceiveTime != undefined) {
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
