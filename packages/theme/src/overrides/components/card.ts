// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Theme } from "@mui/material";

import { OverrideComponentReturn } from "@foxglove/theme/types";

export const card = (_theme: Theme): OverrideComponentReturn<"MuiCard"> => ({
  MuiCard: {
    defaultProps: {
      variant: "outlined",
      square: false,
    },
  },
});
