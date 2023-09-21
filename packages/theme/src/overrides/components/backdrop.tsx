// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Theme, alpha } from "@mui/material";

import { OverrideComponentReturn } from "../../types";

export const MuiBackdrop = (theme: Theme): OverrideComponentReturn<"MuiBackdrop"> => ({
  styleOverrides: {
    root: {
      backgroundColor: alpha(theme.palette.common.black, 0.4),
    },
    invisible: {
      backgroundColor: "transparent",
    },
  },
});
