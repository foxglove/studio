// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Theme } from "@mui/material";

import { OverrideComponentReturn } from "../types";

export function select(theme: Theme): OverrideComponentReturn<"MuiSelect"> {
  return {
    MuiSelect: {
      defaultProps: {
        variant: "outlined",
      },
      styleOverrides: {
        select: {
          "&.MuiInputBase-input": {
            paddingTop: theme.spacing(1),
            paddingBottom: theme.spacing(1),
          },
          "&.MuiInputBase-inputSizeSmall": {
            paddingTop: theme.spacing(0.625),
            paddingBottom: theme.spacing(0.625),
          },
        },
      },
    },
  };
}
