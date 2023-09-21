// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { createTheme, Theme } from "@mui/material/styles";

import { overrides } from "./overrides";
import * as palette from "./palette";
import { Language } from "./types";
import { typography } from "./typography";

type ThemePreference = "dark" | "light";

declare module "@mui/material/styles" {
  interface Theme {
    name?: ThemePreference;
  }
  interface ThemeOptions {
    name?: ThemePreference;
  }
}

export function createMuiTheme(themePreference: ThemePreference, locale?: Language): Theme {
  const theme = createTheme({
    name: themePreference,
    palette: palette[themePreference],
    shape: { borderRadius: 2 },
    typography: typography({ locale }),
  });

  return createTheme({ components: overrides(theme) }, theme);
}
