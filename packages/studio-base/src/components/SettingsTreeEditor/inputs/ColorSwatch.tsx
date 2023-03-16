// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Theme } from "@mui/material";
import tinycolor from "tinycolor2";
import { withStyles } from "tss-react/mui";

function calculateBorderColor(theme: Theme, color: string): string {
  const parsedColor = tinycolor(color);
  return parsedColor.isValid()
    ? theme.palette.getContrastText(parsedColor.toHexString())
    : theme.palette.text.primary;
}

export const ColorSwatch = withStyles("div", (theme, { color }: { color: string }) => ({
  root: {
    // Color on top of white/black diagonal gradient. Color must be specified as a gradient because a
    // background color can't be stacked on top of a background image.
    backgroundImage: `linear-gradient(${color}, ${color}), linear-gradient(to bottom right, white 50%, black 50%)`,
    aspectRatio: "1/1",
    width: theme.spacing(2),
    marginLeft: theme.spacing(0.75),
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${calculateBorderColor(theme, color)}`,
    flexShrink: 0,
  },
}));
