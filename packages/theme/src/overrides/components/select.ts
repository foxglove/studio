// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Theme, selectClasses } from "@mui/material";

import { OverrideComponentReturn } from "@foxglove/theme/types";

export const MuiSelect = (theme: Theme): OverrideComponentReturn<"MuiSelect"> => ({
  styleOverrides: {
    standard: {
      [`&.${selectClasses.select}`]: {
        paddingInlineEnd: theme.spacing(4),
      },
    },
    iconStandard: {
      right: theme.spacing(0.75),
    },
  },
});
