// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Theme } from "@mui/material";
import { CSSProperties } from "react";

export const iconHack = (theme: Theme): { [key: string]: CSSProperties } => ({
  "& svg:not(.MuiSvgIcon-root)": {
    fill: "currentColor",
    width: "1em",
    height: "1em",
    display: "inline-block",
    fontSize: theme.typography.pxToRem(24),
    flexShrink: 0,
    userSelect: "none",
  },
});
