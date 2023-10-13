// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as R from "ramda";

import { createDataset } from "@foxglove/studio-base/panels/Plot/processor/testing";

import { downsampleLTTB } from "./lttb";

const createData = (count: number) => createDataset(count).data;

describe("downsampleLTTB", () => {
  it("does not downsample if numPoints < numBuckets", () => {
    const result = downsampleLTTB(createData(10), 10, 15);
    expect(result?.length).toEqual(10);
  });

  it("does not downsample if numBuckets == 0", () => {
    const result = downsampleLTTB(createData(10), 10, 0);
    expect(result?.length).toEqual(10);
  });

  it("downsamples", () => {
    const result = downsampleLTTB(createData(100), 100, 10);
    expect(result?.length).toEqual(10);
    expect(R.all((index) => index >= 0 && index < 100, result ?? [-1])).toEqual(true);
  });
});
