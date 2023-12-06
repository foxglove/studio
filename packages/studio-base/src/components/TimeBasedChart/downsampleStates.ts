// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Point } from "@foxglove/studio-base/components/Chart/datasets";

import type { PlotViewport } from "./types";

import { calculateIntervals } from "./downsample";

export type StatePoint = {
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

type Interval = {
  // The x coordinate of the beginning of the interval
  x: number;
  // The pixel coordinate of the beginning of the interval
  xPixel: number;
  // The x coordinate of the end of the interval
  endX: number;
  // All of the labels that appeared in this interval
  labels: Immutable<Label[]>;
  // The index of the point that started the interval
  index: number;
};

export function downsampleStates(
  points: Iterable<Point>,
  view: PlotViewport,
  maxPoints?: number,
): StatePoint[] {
  const { bounds } = view;
  const { pixelPerXValue } = calculateIntervals(view, 2, maxPoints);
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

  /**
   * Conclude the current interval, producing one or more StatePoint.
   *
   * If the interval contained just one state, we leave the original point in
   * place.
   *
   * If the interval contained multiple states, we produce two points:
   * * One at the x-value of the first point in the interval
   * * One at the x-value of the end of the interval (which is not a real point)
   * This allows the renderer to draw a gray line segment between these two points.
   */
  const finishInterval = () => {
    if (interval == undefined) {
      return;
    }

    const { labels, endX } = interval;
    const [first] = labels;
    const last = labels.at(-1);
    const haveMultiple = labels.length > 1;

    if (first == undefined || last == undefined) {
      return;
    }

    indices.push({
      x: interval.x,
      index: haveMultiple ? undefined : first.index,
    });

    if (!haveMultiple) {
      return;
    }

    indices.push({
      x: endX,
      index: last.index,
    });
  };

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

    const xPixel = Math.trunc(x * pixelPerXValue);
    const isNew = interval?.xPixel !== xPixel;
    if (interval != undefined && isNew) {
      finishInterval();
    }

    if (interval == undefined || isNew) {
      interval = {
        x,
        endX: bounds.x.min + xPixel * xValuePerPixel + xValuePerPixel,
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
    finishInterval();
  }

  if (firstPastBounds != undefined) {
    indices.push({
      x: maxX,
      index: firstPastBounds,
    });
  }

  return indices;
}
