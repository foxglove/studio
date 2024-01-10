// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as _ from "lodash-es";

import { Immutable, Time } from "@foxglove/studio";
import { RosPath } from "@foxglove/studio-base/components/MessagePathSyntax/constants";
import {
  MAX_POINTS,
  downsampleScatter,
  downsampleTimeseries,
} from "@foxglove/studio-base/components/TimeBasedChart/downsample";
import { Bounds1D } from "@foxglove/studio-base/components/TimeBasedChart/types";
import { unionBounds1D } from "@foxglove/studio-base/types/Bounds";
import { TimestampMethod } from "@foxglove/studio-base/util/time";

import { CsvDataset, Viewport } from "./IDatasetsBuilder";
import type { Dataset, Datum } from "../ChartRenderer";

export type DataItem = Datum & {
  receiveTime: Time;
  headerStamp?: Time;
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
  timestampMethod: TimestampMethod;
  showLine: boolean;
  lineSize: number;
  enabled: boolean;
  // If true, the final dataset data is the time derivative of the input data
  derivative: boolean;
};

type FullDatum = Datum & {
  receiveTime: Time;
  headerStamp?: Time;
  index: number;
};

type Series = {
  config: SeriesConfig;
  current: FullDatum[];
  full: FullDatum[];
};

type ResetSeriesFullAction = {
  type: "reset-full";
  series: string;
};

type ResetSeriesCurrentAction = {
  type: "reset-current";
  series: string;
};

type UpdateSeriesCurrentAction = {
  type: "append-current";
  series: string;
  items: DataItem[];
};

type UpdateSeriesFullAction = {
  type: "append-full";
  series: string;
  items: DataItem[];
};

export type UpdateDataAction =
  | ResetSeriesFullAction
  | ResetSeriesCurrentAction
  | UpdateSeriesCurrentAction
  | UpdateSeriesFullAction;

const MAX_CURRENT_DATUMS = 50_000;

const compareDatum = (a: Datum, b: Datum) => a.x - b.x;

export class TimeseriesDatasetsBuilderImpl {
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
    const numSeries = this.#seriesByMessagePath.size;
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

      // Copy so we can set the .index property for downsampling
      // If downsampling aglos change to not need the .index then we can get rid of some copies
      const allData = series.full.slice();
      if (series.current.length > 0) {
        // Add a NaN entry to create a discontinuity between the full data and the current data and
        // avoid the "long interpolated line" during preloading if the current playback head is
        // later in the data
        allData.push({
          x: NaN,
          y: NaN,
          index: 0,
          receiveTime: { sec: 0, nsec: 0 },
        });
        allData.push(...series.current);
      }

      let startIdx = 0;
      let endIdx = allData.length;

      let xBounds: Bounds1D = { min: Number.MAX_VALUE, max: Number.MIN_VALUE };
      let yBounds: Bounds1D = { min: Number.MAX_VALUE, max: Number.MIN_VALUE };

      let prevX: number = 0;
      let prevY: number = 0;

      const derivative = series.config.derivative;

      // Trim the dataset down to the view area. include one point on either side so it appears
      // to extend out of the view area.
      for (let i = 0; i < allData.length; ++i) {
        const item = allData[i]!;
        item.index = i;

        if (derivative && i === 0) {
          prevX = item.x;
          prevY = item.y;

          // When we compute the derivative we will remove the first datum since we cannot compute its derivative
          startIdx = 1;
          continue;
        }

        if (viewport.bounds.x?.min != undefined && item.x < viewport.bounds.x.min) {
          startIdx = i;
          continue;
        }

        if (derivative) {
          // calculate derivative and replace existing datum
          const rangeDiff = item.x - prevX;
          const newY = rangeDiff === 0 ? 0 : (item.y - prevY) / rangeDiff;
          allData[i] = {
            ...item,
            y: newY,
          };

          prevX = item.x;
          prevY = item.y;
        }

        if (!isNaN(item.x)) {
          xBounds = unionBounds1D(xBounds, { min: item.x, max: item.x });
        }

        if (!isNaN(item.y)) {
          yBounds = unionBounds1D(yBounds, { min: item.y, max: item.y });
        }

        if (viewport.bounds.x?.max != undefined && item.x > viewport.bounds.x.max) {
          endIdx = i;
          break;
        }
      }

      const items = allData.slice(startIdx, endIdx + 1);

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

      const maxPoints = MAX_POINTS / numSeries;
      const downsampledIndicies =
        dataset.showLine === true
          ? downsampleTimeseries(items, downsampleViewport, maxPoints)
          : downsampleScatter(items, downsampleViewport);

      // When a series is downsampled the points are disabled as a visual indicator that
      // data is downsampled.
      //
      // If show line is false then we must show points otherwise nothing will be displayed
      if (downsampledIndicies.length < items.length && dataset.showLine === true) {
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

      const allData = series.full.slice();
      if (series.current.length > 0) {
        allData.push(...series.current);
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
      case "append-current": {
        const series = this.#seriesByMessagePath.get(action.series);
        if (!series) {
          return;
        }

        // trim current data to remove values present in the full data
        const lastX = series.full[series.full.length - 1]?.x;

        // Limit the total current datums for any series so they do not grow indefinitely
        const cullSize = Math.max(
          0,
          series.current.length + action.items.length - MAX_CURRENT_DATUMS,
        );
        series.current.splice(0, cullSize);

        const sorted =
          series.config.timestampMethod === "headerStamp"
            ? action.items.slice().sort(compareDatum)
            : action.items;

        for (const item of sorted) {
          if (lastX != undefined && item.x <= lastX) {
            continue;
          }

          const idx = series.current.length;
          series.current.push({
            index: idx,
            x: item.x,
            y: item.y,
            receiveTime: item.receiveTime,
            headerStamp: item.headerStamp,
          });
        }

        if (series.config.timestampMethod === "headerStamp") {
          series.current.sort(compareDatum);
        }
        break;
      }
      case "append-full": {
        const series = this.#seriesByMessagePath.get(action.series);
        if (!series) {
          return;
        }

        for (const item of action.items) {
          const idx = series.full.length;
          series.full.push({
            index: idx,
            x: item.x,
            y: item.y,
            receiveTime: item.receiveTime,
            headerStamp: item.headerStamp,
          });
        }

        if (series.config.timestampMethod === "headerStamp") {
          series.full.sort(compareDatum);
        }

        // trim current data to remove values present in the full data
        const lastX = series.full[series.full.length - 1]?.x;
        if (lastX != undefined) {
          let idx = 0;
          for (const item of series.current) {
            if (item.x > lastX) {
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
