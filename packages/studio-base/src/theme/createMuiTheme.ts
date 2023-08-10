// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { createTheme, Theme } from "@mui/material/styles";

import { Language } from "@foxglove/studio-base/i18n";

// import muiComponents from "./muiComponents";
import { muiTypography } from "./muiTypography";
import { overrides } from "./overrides";
import * as palette from "./palette";

type ThemePreference = "dark" | "light";

declare module "@mui/material/styles" {
  interface Theme {
    name?: ThemePreference;
  }
  interface ThemeOptions {
    name?: ThemePreference;
  }
}

export function createMuiTheme(
  themePreference: ThemePreference,
  locale: Language | undefined,
): Theme {
  const theme = createTheme({
    palette: palette[themePreference],
    shape: { borderRadius: 2 },
    typography: muiTypography({ locale }),
  });

  // add name for storybook
  return {
    ...theme,
    name: themePreference,
    components: overrides(theme),
  };
}
