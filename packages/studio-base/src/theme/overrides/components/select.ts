// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Theme } from "@mui/material";
import { inputBaseClasses } from "@mui/material/InputBase";

import { OverrideComponentReturn } from "../types";

export const select = (theme: Theme): OverrideComponentReturn<"MuiSelect"> => ({
  MuiSelect: {
    defaultProps: {
      variant: "outlined",
    },
    styleOverrides: {
      select: {
        [`&.${inputBaseClasses.input}`]: {
          paddingInline: theme.spacing(1),
        },
        [`&.${inputBaseClasses.inputSizeSmall}`]: {
          paddingInline: theme.spacing(0.625),
        },
      },
    },
  },
});
