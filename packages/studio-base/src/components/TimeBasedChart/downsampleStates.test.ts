// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { iterateObjects } from "@foxglove/studio-base/components/Chart/datasets";

import { downsampleStates, StatePoint } from "./downsampleStates";
import { ChartDatum as Datum } from "./types";

const createData = (refs: [x: number, label: string][]): Datum[] =>
  refs.map(([x, label]) => ({
    x,
    y: 0,
    label,
  }));

const createResult = (refs: [x: number, index: number | undefined][]): StatePoint[] =>
  refs.map(([x, index]) => ({
    x,
    index,
  }));

const A = "a";
const B = "b";

describe("downsampleStates", () => {
  const bounds = {
    width: 100,
    height: 100,
    bounds: { x: { min: 0, max: 100 }, y: { min: 0, max: 100 } },
  };
  const numPoints = 6; // 3 intervals

  const secondInterval = (100 / 3) * 2;

  it("leaves one center point intact", () => {
    // in:  A--|-B-|--A
    // out: A--|-B-|--A
    const result = downsampleStates(
      iterateObjects(
        createData([
          [0, A],
          [50, B],
          [100, A],
        ]),
      ),
      bounds,
      numPoints,
    );
    expect(result).toEqual(
      createResult([
        [0, 0],
        [50, 1],
        [100, 2],
      ]),
    );
  });

  it("consolidates interval with more than one state", () => {
    // in:  A--|-BA|--A
    // out: A--|-##|--A
    const result = downsampleStates(
      iterateObjects(
        createData([
          [0, A],
          [50, B],
          [51, A],
          [100, A],
        ]),
      ),
      bounds,
      numPoints,
    );
    expect(result).toEqual(
      createResult([
        [0, 0],
        [50, undefined],
        [secondInterval, 2],
        [100, 3],
      ]),
    );
  });

  it("does not consolidate interval with same state as before", () => {
    // in:  A--|AAA|--A
    // out: A--|A--|--A
    const result = downsampleStates(
      iterateObjects(
        createData([
          [0, A],
          [49, A],
          [50, A],
          [51, A],
          [100, A],
        ]),
      ),
      bounds,
      numPoints,
    );
    expect(result).toEqual(
      createResult([
        [0, 0],
        [49, 1],
        [100, 4],
      ]),
    );
  });
});
