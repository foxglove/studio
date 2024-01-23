// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Fade } from "@mui/material";
import tc from "tinycolor2";

import { OverrideComponentReturn } from "../types";

export const MuiTooltip: OverrideComponentReturn<"MuiTooltip"> = {
  defaultProps: {
    arrow: true,
    TransitionComponent: Fade,
    enterDelay: 800,
    enterNextDelay: 200,
    TransitionProps: {
      timeout: { exit: 0 },
    },
  },
  styleOverrides: {
    arrow: ({ theme }) => ({
      color: tc(theme.palette.grey[700]).setAlpha(0.92).toString(),
      backdropFilter: "blur(3px)",
    }),
    tooltip: ({ theme }) => ({
      backgroundColor: tc(theme.palette.grey[700]).setAlpha(0.92).toString(),
      backdropFilter: "blur(3px)",
      fontWeight: "normal",
      fontSize: theme.typography.caption.fontSize,

      kbd: {
        background: tc(theme.palette.common.white).darken(45).toString(),
        padding: theme.spacing(0, 0.5),
        aspectRatio: 1,
        borderRadius: theme.shape.borderRadius,
        marginLeft: theme.spacing(1),
      },
    }),
  },
};
