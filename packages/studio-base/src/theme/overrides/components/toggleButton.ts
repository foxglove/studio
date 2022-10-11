// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { alpha, Theme } from "@mui/material";

import { iconHack } from "../common";
import { OverrideComponentReturn } from "../types";

export function toggleButton(theme: Theme): OverrideComponentReturn<"MuiToggleButton"> {
  return {
    MuiToggleButton: {
      defaultProps: {
        disableRipple: true,
      },
      styleOverrides: {
        root: {
          "&:active": {
            backgroundColor: alpha(
              theme.palette.text.primary,
              theme.palette.action.activatedOpacity,
            ),
          },
          "&.Mui-selected:active": {
            backgroundColor: alpha(
              theme.palette.primary.main,
              theme.palette.action.selectedOpacity + theme.palette.action.activatedOpacity,
            ),
          },
          ...iconHack,
        },
      },
    },
  };
}
