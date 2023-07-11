// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { assignWith, isEmpty } from "lodash";
import memoizeWeak from "memoize-weak";

import { Time } from "@foxglove/rostime";
import { Immutable as Im } from "@foxglove/studio";
import { getDatasetsFromMessagePlotPath } from "@foxglove/studio-base/panels/Plot/datasets";
import { Bounds, makeInvertedBounds, unionBounds } from "@foxglove/studio-base/types/Bounds";
import { Range } from "@foxglove/studio-base/util/ranges";

import {
  BasePlotPath,
  DataSet,
  Datum,
  PlotDataByPath,
  PlotPath,
  PlotXAxisVal,
  isReferenceLinePlotPathType,
} from "./internalTypes";

export type PlotData = {
  bounds: Bounds;
  datasetsByPath: Record<string, DataSet>;
  pathsWithMismatchedDataLengths: string[];
};

export const EmptyPlotData: Im<PlotData> = Object.freeze({
  bounds: makeInvertedBounds(),
  datasetsByPath: {},
  pathsWithMismatchedDataLengths: [],
});

/**
 * Find the earliest and latest times of messages in data, for all messages and per-path.
 * Assumes invidual ranges of messages are already sorted by receiveTime.
 */
function findXRanges(data: Im<PlotData>): {
  all: Range;
  byPath: Record<string, Range>;
} {
  const byPath: Record<string, Range> = {};
  let start = Number.MAX_SAFE_INTEGER;
  let end = Number.MIN_SAFE_INTEGER;
  for (const [path, items] of Object.entries(data.datasetsByPath)) {
    const thisPath = (byPath[path] = {
      start: Number.MAX_SAFE_INTEGER,
      end: Number.MIN_SAFE_INTEGER,
    });
    thisPath.start = Math.min(thisPath.start, items.data.at(0)?.x ?? Number.MAX_SAFE_INTEGER);
    thisPath.end = Math.max(thisPath.end, items.data.at(-1)?.x ?? Number.MIN_SAFE_INTEGER);
    start = Math.min(start, thisPath.start);
    end = Math.max(end, thisPath.end);
  }

  return { all: { start, end }, byPath };
}

/**
 * Appends new PlotData to existing PlotData. Assumes there are no time overlaps between
 * the two items.
 */
export function appendPlotData(a: Im<PlotData>, b: Im<PlotData>): Im<PlotData> {
  if (a === EmptyPlotData) {
    return b;
  }

  if (b === EmptyPlotData) {
    return a;
  }

  return {
    ...a,
    bounds: unionBounds(a.bounds, b.bounds),
    datasetsByPath: assignWith(
      {},
      a.datasetsByPath,
      b.datasetsByPath,
      (objValue: undefined | DataSet, srcValue: undefined | DataSet) => {
        if (objValue == undefined) {
          return srcValue;
        }
        return {
          ...objValue,
          data: objValue.data.concat(srcValue?.data ?? []),
        };
      },
    ),
  };
}

/**
 * Merge two PlotData objects into a single PlotData object, discarding any overlapping
 * messages between the two items. Assumes they represent non-contiguous segments of a
 * chart.
 */
function mergePlotData(a: Im<PlotData>, b: Im<PlotData>): Im<PlotData> {
  if (a === EmptyPlotData) {
    return b;
  }

  if (b === EmptyPlotData) {
    return a;
  }

  return {
    ...a,
    bounds: unionBounds(a.bounds, b.bounds),
    datasetsByPath: assignWith(
      {},
      a.datasetsByPath,
      b.datasetsByPath,
      (objValue: undefined | DataSet, srcValue: undefined | DataSet) => {
        if (objValue == undefined) {
          return srcValue;
        }
        const lastTime = objValue.data.at(-1)?.x ?? Number.MIN_SAFE_INTEGER;
        const newValues = srcValue?.data.filter((datum) => datum.x > lastTime) ?? [];
        if (newValues.length > 0) {
          return {
            ...objValue,
            // Insert NaN/NaN datum to cause a break in the line.
            data: objValue.data.concat({ x: NaN, y: NaN } as Datum, newValues),
          };
        } else {
          return objValue;
        }
      },
    ),
  };
}

const memoFindXRanges = memoizeWeak(findXRanges);

// Sort by start time, then end time, so that folding from the left gives us the
// right consolidated interval.
function compare(a: Im<PlotData>, b: Im<PlotData>): number {
  const rangeA = memoFindXRanges(a).all;
  const rangeB = memoFindXRanges(b).all;
  const startCompare = rangeA.start - rangeB.start;
  return startCompare !== 0 ? startCompare : rangeA.end - rangeB.end;
}

/**
 * Reduce multiple DatasetWithPath objects into a single PlotDataByPath object,
 * concatenating messages for each path after trimming messages that overlap
 * between items.
 */
export function reducePlotData(data: Im<PlotData[]>): Im<PlotData> {
  const sorted = data.slice().sort(compare);

  const reduced = sorted.reduce((acc, item) => {
    if (isEmpty(acc)) {
      return item;
    }
    return mergePlotData(acc, item);
  }, EmptyPlotData);

  return reduced;
}

export function buildPlotData(
  args: Im<{
    invertedTheme?: boolean;
    itemsByPath: PlotDataByPath;
    paths: PlotPath[];
    startTime: Time;
    xAxisPath?: BasePlotPath;
    xAxisVal: PlotXAxisVal;
  }>,
): PlotData {
  const { paths, itemsByPath, startTime, xAxisVal, xAxisPath, invertedTheme } = args;
  const bounds: Bounds = makeInvertedBounds();
  const pathsWithMismatchedDataLengths: string[] = [];
  const datasets: PlotData["datasetsByPath"] = {};
  for (const [index, path] of paths.entries()) {
    const yRanges = itemsByPath[path.value] ?? [];
    const xRanges = xAxisPath && itemsByPath[xAxisPath.value];
    if (!path.enabled) {
      continue;
    } else if (!isReferenceLinePlotPathType(path)) {
      const res = getDatasetsFromMessagePlotPath({
        path,
        yAxisRanges: yRanges,
        index,
        startTime,
        xAxisVal,
        xAxisRanges: xRanges,
        xAxisPath,
        invertedTheme,
      });

      if (res.hasMismatchedData) {
        pathsWithMismatchedDataLengths.push(path.value);
      }
      for (const datum of res.dataset.data) {
        if (isFinite(datum.x)) {
          bounds.x.min = Math.min(bounds.x.min, datum.x);
          bounds.x.max = Math.max(bounds.x.max, datum.x);
        }
        if (isFinite(datum.y)) {
          bounds.y.min = Math.min(bounds.y.min, datum.y);
          bounds.y.max = Math.max(bounds.y.max, datum.y);
        }
      }
      datasets[path.value] = res.dataset;
    }
  }

  return {
    bounds,
    datasetsByPath: datasets,
    pathsWithMismatchedDataLengths,
  };
}
