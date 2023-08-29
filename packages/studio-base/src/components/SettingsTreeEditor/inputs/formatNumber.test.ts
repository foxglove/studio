// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { formatNumber } from "@foxglove/studio-base/components/SettingsTreeEditor/inputs/formatNumber";

describe("formatNumber", () => {
  it("respects precision", () => {
    expect(formatNumber(Math.PI, 3)).toBe(3.142);
  });

  it("trims trailing zeroes", () => {
    expect(formatNumber(1.0001, 3)).toBe(1);
  });

  it("trims padded trailing zeroes", () => {
    expect(formatNumber(1.0001, 10)).toBe(1.0001);
  });
});
