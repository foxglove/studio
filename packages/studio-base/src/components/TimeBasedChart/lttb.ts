// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as R from "ramda";

import { findIndices } from "@foxglove/studio-base/components/Chart/datasets";
import type { TypedData } from "@foxglove/studio-base/components/Chart/types";

/**
 * Choose a subset of points from the provided dataset that retain its visual properties. The output of this algorithm is only well-defined for datasets where the x-axis is sorted and is plotted as a contiguous line.
 *
 * This is an implementation of the "Largest Triangle Three Buckets" algorithm as it appears in Sveinn Steinarsson's 2013 master's thesis of the same name.
 * More information and other implementations: https://github.com/sveinn-steinarsson/flot-downsample
 * The thesis: http://hdl.handle.net/1946/15343
 * Some insight derived from this native JavaScript implementation (license MIT): https://github.com/joshcarr/largest-triangle-three-buckets.js/blob/master/lib/largest-triangle-three-buckets.js
 *
 * Parameters:
 * * data: the raw dataset to downsample
 * * numPoints: the total number of points in `data`
 * * numBuckets: the number of desired output points
 * * startBucket: (optional) the bucket at which to start downsampling (to
 *   allow you to skip some work)
 */
export function downsampleLTTB(
  data: TypedData[],
  numPoints: number,
  numBuckets: number,
  startBucket?: number,
): number[] | undefined {
  if (numBuckets >= numPoints || numBuckets === 0) {
    return R.range(0, numPoints);
  }

  const bucketSize = (numPoints - 2) / (numBuckets - 2);
  const getBucketStart = (index: number): number => Math.floor(index * bucketSize);
  const getBucketEnd = (index: number): number => Math.floor((index + 1) * bucketSize);

  let sliceIndex: number = 0;
  let sliceOffset: number = 0;
  let xBuffer: Float32Array | undefined;
  let yBuffer: Float32Array | undefined;
  let sliceLength: number | undefined;

  const setIndex = (index: number) => {
    const dest = findIndices(data, index);
    if (dest == undefined) {
      return;
    }
    sliceIndex = dest[0];
    sliceOffset = dest[1];

    const slice = data[dest[0]];
    if (slice != undefined) {
      xBuffer = slice.x;
      yBuffer = slice.y;
    }
  };

  const advance = () => {
    sliceOffset += 1;
    if (sliceLength != undefined && sliceOffset < sliceLength) {
      return;
    }
    sliceLength = data[sliceIndex]?.x.length;
    while (sliceLength != undefined && (sliceOffset === sliceLength || sliceLength === 0)) {
      sliceIndex++;
      sliceOffset = 0;
      sliceLength = data[sliceIndex]?.x.length;
      xBuffer = data[sliceIndex]?.x;
      yBuffer = data[sliceIndex]?.y;
    }
  };

  let prevX: number = 0;
  let prevY: number = 0;
  let indices: number[] = [0];
  let maxIndex: number = -1;
  let maxArea: number = 0;

  let bucketStart: number = 0;
  let bucketEnd: number = 0;

  let nextBucket: number = 0;
  let nextStart: number = 0;
  let nextEnd: number = 0;
  let numNext: number = 0;
  let x: number | undefined = 0;
  let y: number | undefined = 0;
  let avgX: number = 0;
  let avgY: number = 0;

  if (startBucket != undefined) {
    indices = [];
  }

  for (const bucketIndex of R.range(startBucket ?? 0, numBuckets - 2)) {
    bucketStart = getBucketStart(bucketIndex);
    bucketEnd = getBucketEnd(bucketIndex);
    nextBucket = bucketIndex + 1;
    nextStart = getBucketStart(nextBucket);
    nextEnd = Math.min(getBucketEnd(nextBucket), numPoints);
    numNext = nextEnd - nextStart;
    setIndex(nextStart);

    // Next, get the average of the following bucket
    avgX = 0;
    avgY = 0;
    for (let i = nextStart; i < nextEnd; i++) {
      if (xBuffer == undefined || yBuffer == undefined) {
        return undefined;
      }
      x = xBuffer[sliceOffset]!;
      y = yBuffer[sliceOffset]!;
      avgX += x;
      avgY += y;
      advance();
    }
    avgX /= numNext;
    avgY /= numNext;

    setIndex(getBucketStart(bucketIndex));

    maxIndex = -1;
    maxArea = 0;
    // Choose the triangle with the maximum area
    for (let i = bucketStart; i < bucketEnd; i++) {
      if (xBuffer == undefined || yBuffer == undefined) {
        return undefined;
      }
      x = xBuffer[sliceOffset]!;
      y = yBuffer[sliceOffset]!;
      const area = Math.abs((prevX - avgX) * (y - prevY) - (prevX - x) * (avgY - prevY));
      if (area < maxArea) {
        continue;
      }
      maxArea = area;
      maxIndex = i;
      prevX = x;
      prevY = y;
      advance();
    }

    if (maxIndex === -1) {
      return undefined;
    }

    indices.push(maxIndex);
  }

  indices.push(numPoints - 1);
  return indices;
}
