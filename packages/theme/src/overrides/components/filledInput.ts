// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Theme, alpha, filledInputClasses } from "@mui/material";

import { OverrideComponentReturn } from "@foxglove/theme/types";

export const filledInput = (theme: Theme): OverrideComponentReturn<"MuiFilledInput"> => ({
  MuiFilledInput: {
    defaultProps: {
      disableUnderline: true,
    },
    styleOverrides: {
      input: {
        padding: theme.spacing(1, 1.125),
      },
      inputSizeSmall: {
        padding: theme.spacing(0.75, 1),
      },
      root: {
        borderRadius: theme.shape.borderRadius,

        "&.Mui-focused": {
          backgroundColor: alpha(theme.palette.primary.main, theme.palette.action.focusOpacity),
          // outline: "2px solid",
          // outlineColor: theme.palette.primary.main,
          // outlineOffset: -2,

          [`&.${filledInputClasses.colorSecondary}`]: {
            // outlineColor: theme.palette.secondary.main,

            backgroundColor: alpha(theme.palette.secondary.main, theme.palette.action.focusOpacity),
          },
          [`&.${filledInputClasses.error}`]: {
            backgroundColor: alpha(theme.palette.error.main, theme.palette.action.focusOpacity),
          },
        },
        "&.Mui-disabled": {
          opacity: 0.5,
        },
        "&.Mui-error": {
          backgroundColor: alpha(theme.palette.error.main, 0.06),
        },
      },
    },
  },
});
