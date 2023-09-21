// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Theme } from "@mui/material";
import { tabsClasses } from "@mui/material/Tabs";

import { OverrideComponentReturn } from "@foxglove/theme/types";

export const MuiTabs = (_theme: Theme): OverrideComponentReturn<"MuiTabs"> => ({
  styleOverrides: {
    vertical: {
      [`.${tabsClasses.indicator}`]: {
        left: 0,
        right: "auto",
      },
    },
  },
});
