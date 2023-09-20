// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Theme } from "@mui/material";

import { OverrideComponentReturn } from "../types";

export const tab = (theme: Theme): OverrideComponentReturn<"MuiTab"> => ({
  MuiTab: {
    styleOverrides: {
      root: {
        opacity: 0.8,

        "&.Mui-selected": {
          opacity: 1,
        },

        "&:not(.Mui-selected):hover": {
          opacity: 1,
          color: theme.palette.text.primary,
        },
      },
      selected: {},
    },
  },
});
