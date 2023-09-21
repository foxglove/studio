// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Theme, alpha, inputClasses } from "@mui/material";

import { OverrideComponentReturn } from "@foxglove/theme/types";

export const input = (theme: Theme): OverrideComponentReturn<"MuiInput"> => ({
  MuiInput: {
    defaultProps: {
      disableUnderline: true,
    },
    styleOverrides: {
      root: {
        borderRadius: theme.shape.borderRadius,

        ":hover": {
          backgroundColor: theme.palette.action.hover,
        },
        "&.Mui-focused": {
          backgroundColor: alpha(theme.palette.primary.main, theme.palette.action.focusOpacity),
          // outline: "2px solid",
          // outlineColor: theme.palette.primary.main,
          // outlineOffset: -2,

          [`&.${inputClasses.colorSecondary}`]: {
            // outlineColor: theme.palette.secondary.main,

            backgroundColor: alpha(theme.palette.secondary.main, theme.palette.action.focusOpacity),
          },
          [`&.${inputClasses.error}`]: {
            backgroundColor: alpha(theme.palette.error.main, theme.palette.action.focusOpacity),
          },
        },
      },
      input: {
        padding: theme.spacing(1, 1.125),
      },
      inputSizeSmall: {
        padding: theme.spacing(0.75, 1),
      },
    },
  },
});
