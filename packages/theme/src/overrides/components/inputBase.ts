// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Theme, inputBaseClasses } from "@mui/material";

import { OverrideComponentReturn } from "@foxglove/theme/types";

export const MuiInputBase = (theme: Theme): OverrideComponentReturn<"MuiInputBase"> => ({
  styleOverrides: {
    root: {
      [`&.${inputBaseClasses.adornedStart}`]: {
        paddingInlineStart: theme.spacing(1),
      },
      [`&.${inputBaseClasses.adornedEnd}`]: {
        paddingInlineEnd: theme.spacing(1),
      },
      [`.${inputBaseClasses.inputAdornedStart}`]: {
        paddingInlineStart: theme.spacing(0.75),
      },
      [`.${inputBaseClasses.inputAdornedEnd}`]: {
        paddingInlineEnd: theme.spacing(0.75),
      },
    },
    input: {
      "::placeholder": {
        transition: "none",
        opacity: 0.6,
      },
      ":focus::placeholder": {
        opacity: 0,
      },
    },
  },
});
