// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Theme } from "@mui/material";

import { OverrideComponentReturn } from "../types";

export function autocomplete(theme: Theme): OverrideComponentReturn<"MuiAutocomplete"> {
  return {
    MuiAutocomplete: {
      styleOverrides: {
        root: {
          ".MuiInputBase-root. .MuiAutocomplete-input.MuiInputBase-input": {
            padding: theme.spacing(1, 1.25),
          },
          ".MuiInputBase-root.MuiInputBase-sizeSmall": {
            paddingBottom: 0,

            ".MuiAutocomplete-input.MuiInputBase-inputSizeSmall": {
              padding: theme.spacing(0.5, 1),
            },
          },
          ".MuiInputBase-root .MuiAutocomplete-endAdornment": {
            marginRight: theme.spacing(-0.5),
          },
        },
        endAdornment: {
          top: `calc(50% - ${theme.spacing(1.5)})`,
        },
      },
    },
  };
}
