// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Immutable } from "@foxglove/studio";

export type Bounds1D = {
  min: number;
  max: number;
};

/**
 * Describes the limits of a rectangular area in 2d space.
 */
export type Bounds = {
  x: Bounds1D;
  y: Bounds1D;
};

/**
 * Find the union of two 1D bounds.
 */
export function unionBounds1D(a: Immutable<Bounds1D>, b: Immutable<Bounds1D>): Bounds1D {
  return { min: Math.min(a.min, b.min), max: Math.max(a.max, b.max) };
}
