// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Point } from "@foxglove/studio-base/components/Chart/datasets";

import type { PlotViewport } from "./types";

import { MINIMUM_PIXEL_DISTANCE } from "./downsample";

type StatePoint = {
  x: number;
  index: number | undefined;
};

type Label = {
  index: number;
  value: string;
};

function addLabel(label: Label, labels: Label[]): Label[] {
  const last = labels.at(-1);
  if (last != undefined && label.value === last.value) {
    return labels;
  }

  return [...labels, label];
}

type Interval = { x: number; xPixel: number; labels: Label[]; index: number };

// get:    o--|--o-oo-|-o
// return: o-----|-oo-|-o

export function downsampleStates(
  points: Iterable<Point>,
  view: PlotViewport,
  maxPoints?: number,
): StatePoint[] {
  const { bounds, width } = view;

  const numPixelIntervals = Math.trunc(width / MINIMUM_PIXEL_DISTANCE);
  // When maxPoints is provided, we should take either that constant or
  // the number of pixel-defined intervals, whichever is fewer
  const numPoints = Math.min(maxPoints ?? numPixelIntervals, numPixelIntervals);
  // We then calculate the number of intervals based on the number of points we
  // decided on
  const numIntervals = Math.trunc(numPoints);
  const pixelPerXValue = numIntervals / (bounds.x.max - bounds.x.min);
  const xValuePerPixel = 1 / pixelPerXValue;

  const indices: StatePoint[] = [];
  let interval: Interval | undefined;

  // We keep points within a buffer window around the bounds so points near the bounds are
  // connected to their peers and available for pan/zoom.
  // Points outside this buffer window are dropped.
  const xRange = bounds.x.max - bounds.x.min;
  const minX = bounds.x.min - xRange * 0.5;
  const maxX = bounds.x.max + xRange * 0.5;

  let firstPastBounds: number | undefined = undefined;

  for (const datum of points) {
    const { index, label, x } = datum;

    // track the first point before our bounds
    if (datum.x < minX) {
      const point = {
        index,
        x,
      };
      if (indices.length === 0) {
        indices.push(point);
      } else {
        indices[0] = point;
      }
      continue;
    }

    // track the first point outside of our bounds
    if (datum.x > maxX) {
      firstPastBounds = index;
      continue;
    }

    if (label == undefined) {
      continue;
    }

    const xPixel = Math.trunc(datum.x * pixelPerXValue);
    const isNew = interval?.xPixel !== xPixel;

    if (interval != undefined && isNew) {
      const { labels } = interval;
      const [first] = labels;
      const last = labels.at(-1);
      const haveMultiple = labels.length > 1;

      if (first != undefined && last != undefined) {
        indices.push({
          x: interval.x,
          index: haveMultiple ? undefined : first.index,
        });

        if (haveMultiple) {
          indices.push({
            x: interval.x + xValuePerPixel,
            index: last.index,
          });
        }
      }
    }

    if (interval == undefined || isNew) {
      interval = {
        x,
        xPixel,
        index,
        labels: [
          {
            index,
            value: label,
          },
        ],
      };
      continue;
    }

    interval.labels = addLabel(
      {
        index,
        value: label,
      },
      interval.labels,
    );
  }

  if (interval != undefined) {
    //indices.push([interval.index, new Set(interval.labels).size]);
  }

  if (firstPastBounds != undefined) {
    //indices.push([firstPastBounds, 1]);
  }

  return indices;
}
