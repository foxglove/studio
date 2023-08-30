// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { sliceTyped } from "./datasets";
import { TypedData } from "./internalTypes";

const ZERO_TIME = Object.freeze({ sec: 0, nsec: 0 });

function makeDataset(items: number[]): TypedData {
  return {
    x: Float32Array.from(items),
    y: Float32Array.from(items),
    value: [...items],
    receiveTime: items.map(() => ZERO_TIME),
  };
}

describe("sliceTyped", () => {
  const sample: TypedData[] = [makeDataset([1, 2, 3])];
  it("handles empty result", () => {
    expect(sliceTyped(sample, 0, 0)).toEqual([]);
  });
  it("handles bad index result", () => {
    expect(sliceTyped(sample, -50, 0)).toEqual([]);
  });
  it("leaves data unchanged", () => {
    expect(sliceTyped(sample, 0, 3)).toEqual(sample);
  });
  it("handles negative start index", () => {
    expect(sliceTyped(sample, -3)).toEqual(sample);
  });
  it("handles negative end index", () => {
    expect(sliceTyped(sample, 0, -1)).toEqual([makeDataset([1, 2])]);
  });
});
