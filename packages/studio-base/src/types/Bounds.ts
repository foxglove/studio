// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Immutable } from "@foxglove/studio";

/**
 * Describes a bounded rectangle in 2d space.
 */
export type Bounds = {
  x: { min: number; max: number };
  y: { min: number; max: number };
};

/**
 * Creates initial bounds with values set to extremes to simplify merging bounds.
 */
export function makeInitialBounds(): Bounds {
  return {
    x: { min: Number.MAX_SAFE_INTEGER, max: Number.MIN_SAFE_INTEGER },
    y: { min: Number.MAX_SAFE_INTEGER, max: Number.MIN_SAFE_INTEGER },
  };
}

/**
 * Merges two bounds into the smallest area that encompasses them both.
 */
export function mergeBounds(a: Immutable<Bounds>, b: Immutable<Bounds>): Bounds {
  return {
    x: { min: Math.min(a.x.min, b.x.min), max: Math.max(a.x.max, b.x.max) },
    y: { min: Math.min(a.y.min, b.y.min), max: Math.max(a.y.max, b.y.max) },
  };
}
