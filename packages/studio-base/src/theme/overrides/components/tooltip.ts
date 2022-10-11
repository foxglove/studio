// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Theme } from "@mui/material";

import { OverrideComponentReturn } from "../types";

export function tooltip(theme: Theme): OverrideComponentReturn<"MuiTooltip"> {
  return {
    MuiTooltip: {
      defaultProps: {
        arrow: true,
      },
      styleOverrides: {
        arrow: {
          color: theme.palette.grey[700],
        },
        tooltip: {
          backgroundColor: theme.palette.grey[700],
          fontWeight: "normal",
          fontSize: "0.75rem",
        },
      },
    },
  };
}
