// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import type { ChartDataset } from "chart.js";

import { Point } from "@foxglove/studio-base/components/Chart/datasets";

import type { PlotViewport } from "./types";

type Dataset<T> = ChartDataset<"scatter", T>;

// This is the desired number of data points for each plot across all signals
// and data sources. Beyond this threshold, ChartJS can no longer render at
// 60FPS.
export const MAX_POINTS = 5_000;

/**
 * Downsample a timeseries dataset
 *
 * This function assumes the dataset x axis time and sorted.
 *
 * The downsampled data preserves the shape of the original data. The algorithm does this by
 * downsampling within an interval. Each interval tracks the first datum of the interval,
 * minimum y-value datum, maximum y-value datum, and the last datum of the interval.
 *
 * For each datum within the dataset, we determine first if it falls within the current interval.
 * - If the datum falls within the current interval we update the min/max y or last values. Then move
 *   to the next datum.
 * - If the datum falls outside the current interval, we determine whether to add the min/max and
 *   last datum to the downsampled dataset, and then move to the next datum.
 * - If first/min/max/last are all the same datum, then only one datum appears in the downsampled
 *   dataset.
 *
 * By tracking the first/min/max/last within an interval, the shape of the original data is preserved.
 * Points before the interval connect into the interval with the same slope line as the original
 * dataset, and the interval connects to the next interval with the same slope line as the original
 * data. The min/max entries preserve spikes within the data.
 */
export function downsampleTimeseries(
  points: Iterable<Point>,
  view: PlotViewport,
  numPoints?: number,
): number[] {
  const { bounds, width, height } = view;

  // Each interval can produce up to four points
  const numIntervals = (numPoints ?? width) / 4;
  const pixelPerXValue = numIntervals / (bounds.x.max - bounds.x.min);
  const pixelPerYValue = height / (bounds.y.max - bounds.y.min);

  const indices: number[] = [];

  type IntervalItem = { xPixel: number; yPixel: number; label: string | undefined; index: number };

  let intFirst: IntervalItem | undefined;
  let intLast: IntervalItem | undefined;
  let intMin: IntervalItem | undefined;
  let intMax: IntervalItem | undefined;

  // We keep points within a buffer window around the bounds so points near the bounds are
  // connected to their peers and available for pan/zoom.
  // Points outside this buffer window are dropped.
  const xRange = bounds.x.max - bounds.x.min;
  const minX = bounds.x.min - xRange * 0.5;
  const maxX = bounds.x.max + xRange * 0.5;

  let firstPastBounds: number | undefined = undefined;

  for (const datum of points) {
    const { index, label } = datum;

    // track the first point before our bounds
    if (datum.x < minX) {
      if (indices.length === 0) {
        indices.push(index);
      } else {
        // the first point outside our bounds will always be at index 0
        indices[0] = index;
      }
      continue;
    }

    // track the first point outside of our bounds
    if (datum.x > maxX) {
      firstPastBounds = index;
      continue;
    }

    // Benchmarking shows, at least as of the time of this writing, that Math.trunc is
    // *much* faster than Math.round on this data.
    const x = Math.trunc(datum.x * pixelPerXValue);
    const y = Math.trunc(datum.y * pixelPerYValue);

    // interval has ended, we determine whether to write additional points for min/max/last. Always
    // create a new interval when encountering a new label to preserve the transition from one label to another
    if (intFirst?.xPixel !== x || (intLast?.label != undefined && intLast.label !== datum.label)) {
      // add the min value from previous interval if it doesn't match the first or last of that interval
      if (intMin && intMin.yPixel !== intFirst?.yPixel && intMin.yPixel !== intLast?.yPixel) {
        indices.push(intMin.index);
      }

      // add the max value from previous interval if it doesn't match the first or last of that interval
      if (intMax && intMax.yPixel !== intFirst?.yPixel && intMax.yPixel !== intLast?.yPixel) {
        indices.push(intMax.index);
      }

      // add the last value if it doesn't match the first
      if (intLast && intFirst?.yPixel !== intLast.yPixel) {
        indices.push(intLast.index);
      }

      // always add the first datum of an new interval
      indices.push(index);

      intFirst = { xPixel: x, yPixel: y, index, label };
      intLast = { xPixel: x, yPixel: y, index, label };
      intMin = { xPixel: x, yPixel: y, index, label };
      intMax = { xPixel: x, yPixel: y, index, label };
      continue;
    }

    intLast ??= { xPixel: x, yPixel: y, index, label };
    intLast.xPixel = x;
    intLast.yPixel = y;
    intLast.index = index;
    intLast.label = label;

    if (intMin && y < intMin.yPixel) {
      intMin.yPixel = y;
      intMin.index = index;
      intMin.label = label;
    }

    if (intMax && y > intMax.yPixel) {
      intMax.yPixel = y;
      intMax.index = index;
      intMax.label = label;
    }
  }

  // add the min value from previous interval if it doesn't match the first or last of that interval
  if (intMin && intMin.yPixel !== intFirst?.yPixel && intMin.yPixel !== intLast?.yPixel) {
    indices.push(intMin.index);
  }

  // add the max value from previous interval if it doesn't match the first or last of that interval
  if (intMax && intMax.yPixel !== intFirst?.yPixel && intMax.yPixel !== intLast?.yPixel) {
    indices.push(intMax.index);
  }

  // add the last value if it doesn't match the first
  if (intLast && intFirst?.yPixel !== intLast.yPixel) {
    indices.push(intLast.index);
  }

  if (firstPastBounds != undefined) {
    indices.push(firstPastBounds);
  }

  return indices;
}

export function downsampleScatter(points: Iterable<Point>, view: PlotViewport): number[] {
  const { bounds, width, height } = view;

  const pixelPerXValue = width / (bounds.x.max - bounds.x.min);
  const pixelPerYValue = height / (bounds.y.max - bounds.y.min);
  const pixelPerRow = width;

  const indices: number[] = [];

  // downsampling tracks a sparse array of x/y locations
  const sparse: boolean[] = [];

  for (const datum of points) {
    // Out-of-bounds scatter points are ignored. We don't filter on y
    // because y values are needed to allow chart to auto scale to the correct
    // height.
    if (datum.x > bounds.x.max || datum.x < bounds.x.min) {
      continue;
    }

    const x = Math.round(datum.x * pixelPerXValue);
    const y = Math.round(datum.y * pixelPerYValue);

    // the locator is the x/y pixel value as one number
    const locator = y * pixelPerRow + x;
    if (sparse[locator] === true) {
      continue;
    }
    sparse[locator] = true;
    indices.push(datum.index);
  }

  // Technically a lie because this may have downsampled but we say it did not
  // so the points are still rendered
  return indices;
}

/**
 * Given a dataset and a viewport, `downsample` chooses a list of
 * representative points that, when plotted, resemble the full dataset.
 */
export function downsample<T>(
  dataset: Dataset<T>,
  points: Iterable<Point>,
  view: PlotViewport,
  numPoints?: number,
): number[] {
  return dataset.showLine !== true
    ? downsampleScatter(points, view)
    : downsampleTimeseries(points, view, numPoints);
}
