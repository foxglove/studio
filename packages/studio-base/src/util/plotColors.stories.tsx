// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import tinycolor from "tinycolor2";

import Stack from "@foxglove/studio-base/components/Stack";

import { expandedLineColors, lineColors } from "./plotColors";

export default {
  title: "plotColors",
  parameters: {
    colorScheme: "both-column",
  },
};

export function PlotColors(): JSX.Element {
  return (
    <Stack gap={2} padding={2}>
      <Stack direction="row">
        {lineColors.map((color, idx) => (
          <div key={idx} style={{ width: 20, height: 20, backgroundColor: color }} />
        ))}
      </Stack>
      <Stack direction="row">
        {expandedLineColors.map((color, idx) => (
          <div key={idx} style={{ width: 20, height: 20, backgroundColor: color }} />
        ))}
      </Stack>
      <Stack direction="row">
        {[...expandedLineColors]
          .sort((c1, c2) => {
            return tinycolor(c1).toHsv().h - tinycolor(c2).toHsv().h;
          })
          .map((color, idx) => (
            <div key={idx} style={{ width: 20, height: 20, backgroundColor: color }} />
          ))}
      </Stack>
    </Stack>
  );
}
