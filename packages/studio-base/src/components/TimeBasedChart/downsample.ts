// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { ChartData, ScatterDataPoint } from "chart.js";

// Chartjs typings use _null_ to indicate _gaps_ in the dataset
// eslint-disable-next-line no-restricted-syntax
type ChartNull = null;
type Data = ChartData<"scatter", (ScatterDataPoint | ChartNull)[]>;
type DataSet = Data["datasets"][0];

type DownsampleBounds = {
  width: number;
  height: number;
  x: { min: number; max: number };
  y: { min: number; max: number };
};

type Point = { x: number; y: number };

function distanceSquared(p1: Point, p2: Point) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return dx * dx + dy * dy;
}

export default function downsample(dataset: DataSet, bounds: DownsampleBounds): DataSet {
  // datasets of length 1 don't need downsampling
  if (dataset.data.length <= 1) {
    return dataset;
  }

  const pixelPerXValue = bounds.width / (bounds.x.max - bounds.x.min);
  const pixelPerYValue = bounds.height / (bounds.y.max - bounds.y.min);

  // ignore points if they are within 1 pixel of each other
  const threshold = 2;

  const prevPoint: { x: number; y: number } | undefined = undefined;
  const endIndex = dataset.data.length - 1;

  const downsampled: ScatterDataPoint[] = [];

  type IntervalItem = { xPixel: number; yPixel: number; datum: ScatterDataPoint };

  let intFirst: IntervalItem | undefined;
  let intLast: IntervalItem | undefined;
  let intMin: IntervalItem | undefined;
  let intMax: IntervalItem | undefined;

  for (const datum of dataset.data) {
    if (!datum) {
      continue;
    }

    // we need to keep the first points outside the set
    if (datum.x < bounds.x.min || datum.x > bounds.x.max) {
      continue;
    }

    if (datum.y < bounds.y.min || datum.y > bounds.y.max) {
      continue;
    }

    const x = Math.round(datum.x * pixelPerXValue);
    const y = Math.round(datum.y * pixelPerYValue);

    // interval has ended
    if (intFirst?.xPixel !== x) {
      // add the min value from previous interval if it doesn't match the first or last of that interval
      if (intMin && intMin?.yPixel !== intFirst?.yPixel && intMin?.yPixel !== intLast?.yPixel) {
        downsampled.push(intMin?.datum);
      }

      // add the max value from previous interval if it doesn't match the first or last of that interval
      if (intMax && intMax?.yPixel !== intFirst?.yPixel && intMax?.yPixel !== intLast?.yPixel) {
        downsampled.push(intMax?.datum);
      }

      // add the last value if it doesn't match the first
      if (intLast && intFirst?.yPixel !== intLast?.yPixel) {
        downsampled.push(intLast.datum);
      }

      // always add the first datum of an new interval
      downsampled.push(datum);

      intFirst = intLast = { xPixel: x, yPixel: y, datum };
      intMin = { xPixel: x, yPixel: y, datum };
      intMax = { xPixel: x, yPixel: y, datum };
      continue;
    }

    intLast = { xPixel: x, yPixel: y, datum };

    if (intMin && y < intMin.yPixel) {
      intMin.yPixel = y;
      intMin.datum = datum;
    }

    if (intMax && y > intMax.yPixel) {
      intMax.yPixel = y;
      intMax.datum = datum;
    }
  }

  // add the min value from previous interval if it doesn't match the first or last of that interval
  if (intMin && intMin?.yPixel !== intFirst?.yPixel && intMin?.yPixel !== intLast?.yPixel) {
    downsampled.push(intMin?.datum);
  }

  // add the max value from previous interval if it doesn't match the first or last of that interval
  if (intMax && intMax?.yPixel !== intFirst?.yPixel && intMax?.yPixel !== intLast?.yPixel) {
    downsampled.push(intMax?.datum);
  }

  // add the last value if it doesn't match the first
  if (intLast && intFirst?.yPixel !== intLast?.yPixel) {
    downsampled.push(intLast.datum);
  }

  /*
  const downsampled = filterMap(dataset.data, (datum, index) => {
    if (!datum) {
      return datum;
    }

    const point = { x: datum.x * pixelPerXValue, y: datum.y * pixelPerYValue };

    const existing = sparseX[point.x];
    if (!existing) {
      sparseX[point.x] = { min: datum.y, max: datum.y };
      return datum;
    }

    if (!prevPoint) {
      prevPoint = point;
      return datum;
    }

    // Always keep the last data point
    if (index === endIndex) {
      return datum;
    }

    const pixelDistSq = distanceSquared(point, prevPoint);
    if (pixelDistSq < threshold) {
      return undefined;
    }

    prevPoint = point;
    return datum;
  });
  */

  return { ...dataset, data: downsampled };
}
