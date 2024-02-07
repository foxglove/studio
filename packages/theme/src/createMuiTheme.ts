// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { zhCN, jaJP, enUS, Localization } from "@mui/material/locale";
import { createTheme, Theme } from "@mui/material/styles";
import * as _ from "lodash-es";

import * as components from "./components";
import * as palette from "./palette";
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

function getMaterialLocale(lang: string): Localization {
  switch (lang) {
    case "zh":
      return zhCN;
    case "jp":
      return jaJP;
    case "en":
      return enUS;
    default:
      return enUS;
  }
}

export const createMuiTheme = (themePreference: ThemePreference, lang: string): Theme =>
  createTheme(
    _.merge(getMaterialLocale(lang), {
      name: themePreference,
      palette: palette[themePreference],
      shape: { borderRadius: 2 },
      typography,
      components,
    }),
  );
