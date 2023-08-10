// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Theme } from "@mui/material";

import { OverrideComponentReturn } from "../types";

export const inputBase = (theme: Theme): OverrideComponentReturn<"MuiInputBase"> => ({
  MuiInputBase: {
    styleOverrides: {
      adornedEnd: {
        "&.MuiInputBase-sizeSmall": {
          paddingRight: theme.spacing(1),

          "& .MuiSvgIcon-root": {
            fontSize: "1rem",
          },
        },
      },
      adornedStart: {
        "&.MuiInputBase-sizeSmall": {
          paddingLeft: theme.spacing(1),

          "& .MuiSvgIcon-root": {
            fontSize: "1rem",
          },
          "& .MuiSelect-select": {
            paddingRight: `${theme.spacing(2)} !important`,
          },
        },
      },
      inputSizeSmall: {
        fontSize: theme.typography.body2.fontSize,
      },
      root: {
        "&.MuiInput-root": {
          marginTop: 0,
        },
      },
    },
  },
});
