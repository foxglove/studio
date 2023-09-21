// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Theme, alpha } from "@mui/material";

import { OverrideComponentReturn } from "@foxglove/theme/types";

export const toggleButton = (theme: Theme): OverrideComponentReturn<"MuiToggleButton"> => ({
  MuiToggleButton: {
    defaultProps: {
      disableRipple: true,
    },
    styleOverrides: {
      root: {
        "&:active": {
          backgroundColor: alpha(theme.palette.text.primary, theme.palette.action.activatedOpacity),
        },
        "&.Mui-selected:active": {
          backgroundColor: alpha(
            theme.palette.primary.main,
            theme.palette.action.selectedOpacity + theme.palette.action.activatedOpacity,
          ),
        },
      },
    },
  },
});
