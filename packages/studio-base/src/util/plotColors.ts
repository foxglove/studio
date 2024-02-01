// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
//
// This file incorporates work covered by the following copyright and
// permission notice:
//
//   Copyright 2018-2021 Cruise LLC
//
//   This source code is licensed under the Apache License, Version 2.0,
//   found at http://www.apache.org/licenses/LICENSE-2.0
//   You may not use this file except in compliance with the License.

import * as _ from "lodash-es";
import tinycolor from "tinycolor2";

import { toolsColorScheme } from "@foxglove/studio-base/util/toolsColorScheme";

// Inspired by the "light" scheme from https://personal.sron.nl/~pault/#sec:qualitative
// but using our standard tools colors.
export const lineColors = [
  toolsColorScheme.blue.medium,
  toolsColorScheme.orange.medium,
  toolsColorScheme.yellow.medium,
  toolsColorScheme.green.medium,
  toolsColorScheme.cyan.medium,
  toolsColorScheme.purple.medium,
  toolsColorScheme.paleGreen.medium,
];

const colorExpansion = lineColors.map((color) => [
  color,
  ...tinycolor(color)
    .tetrad()
    .map((acolor) => acolor.toHexString()),
]);

// export const expandedLineColors = _.uniq(
//   _.range(0, colorExpansion[0]!.length)
//     .map((i) => colorExpansion.map((colors) => colors[i]!))
//     .flat(),
// );
// export const expandedLineColors = _.range(10).flatMap((i) => [
//   tinycolor({ h: (i * 360) / 10, s: 1, v: 0.8 }).toHexString(),
//   tinycolor({ h: (i * 360) / 10, s: 0.8, v: 1 }).toHexString(),
// ]);
export const expandedLineColors = [
  // "#8dd3c7",
  // "#ffffb3",
  // "#bebada",
  // "#fb8072",
  // "#80b1d3",
  // "#fdb462",
  // "#b3de69",
  // "#fccde5",
  // "#d9d9d9",
  // "#bc80bd",
  // "#ccebc5",
  // "#ffed6f",
  //
  "#a6cee3",
  "#1f78b4",
  "#b2df8a",
  "#33a02c",
  "#fb9a99",
  "#e31a1c",
  "#fdbf6f",
  "#ff7f00",
  "#cab2d6",
  "#6a3d9a",
  "#ffff99",
  "#b15928",
];

export const lightColor: (_: string) => string = _.memoize((color: string): string =>
  tinycolor(color).brighten(15).toString(),
);

export const darkColor: (_: string) => string = _.memoize((color: string): string =>
  tinycolor(color).darken(30).toString(),
);

export function getLineColor(color: string | undefined, index: number): string {
  return color ?? lineColors[index % lineColors.length]!;
}

export function getContrastColor(colorScheme: "light" | "dark", color: string): string {
  return colorScheme === "light" ? darkColor(color) : lightColor(color);
}
