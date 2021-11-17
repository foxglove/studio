// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { ITheme as FluentTheme } from "@fluentui/react";
import { Theme as MuiTheme } from "@mui/material";

import createFluentTheme from "./createFluentTheme";
import createMuiTheme, { ThemePreference } from "./createMuiTheme";

export function createTheme(themePreference: ThemePreference): {
  mui: MuiTheme;
  fluent: FluentTheme;
} {
  const mui = createMuiTheme(themePreference);
  const fluent = createFluentTheme(mui);

  return {
    mui,
    fluent,
  };
}
