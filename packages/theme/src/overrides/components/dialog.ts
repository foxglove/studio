// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Theme } from "@mui/material";

import { OverrideComponentReturn } from "@foxglove/theme/types";

export const dialog = (theme: Theme): OverrideComponentReturn<"MuiDialog"> => ({
  MuiDialog: {
    defaultProps: {
      PaperProps: {
        elevation: 4,
      },
    },
    styleOverrides: {
      paper: {
        // Prevent dialog from going underneath window title bar controls on Windows
        maxHeight: `calc(100% - 2 * (env(titlebar-area-height, ${theme.spacing(
          2,
        )}) + ${theme.spacing(2)}))`,
      },
    },
  },
});
