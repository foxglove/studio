// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  BaseSlots,
  ITheme,
  ThemeGenerator,
  createTheme,
  getColorFromString,
  themeRulesStandardCreator,
} from "@fluentui/react";
import { Theme } from "@mui/material";

import { fonts } from "@foxglove/studio-base/util/sharedStyleConstants";

import fluentComponents from "./fluentComponents";

export default function createFluentTheme(theme: Theme): ITheme {
  const { palette } = theme;
  const themeRules = themeRulesStandardCreator();

  const isInverted = palette.mode === "dark";

  ThemeGenerator.insureSlots(themeRules, isInverted);
  ThemeGenerator.setSlot(
    themeRules[BaseSlots[BaseSlots.primaryColor]!]!,
    getColorFromString(palette.primary.main)!,
  );
  ThemeGenerator.setSlot(
    themeRules[BaseSlots[BaseSlots.foregroundColor]!]!,
    getColorFromString(palette.text.primary)!,
  );
  ThemeGenerator.setSlot(
    themeRules[BaseSlots[BaseSlots.backgroundColor]!]!,
    getColorFromString(palette.background.paper)!,
  );
  const themeAsJson: {
    [key: string]: string;
  } = ThemeGenerator.getThemeAsJson(themeRules);

  return createTheme({
    ...{
      defaultFontStyle: {
        fontFamily: fonts.SANS_SERIF,
        fontFeatureSettings: fonts.SANS_SERIF_FEATURE_SETTINGS,
      },
      palette: themeAsJson,
    },
    components: fluentComponents,
    isInverted,
  });
}
