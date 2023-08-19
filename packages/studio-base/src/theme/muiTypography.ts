// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { ThemeOptions, TypographyStyle } from "@mui/material";

import { Language } from "@foxglove/studio-base/i18n";
import { fonts } from "@foxglove/studio-base/util/sharedStyleConstants";

declare module "@mui/material/styles/createTypography" {
  interface Typography {
    fontFeatureSettings: string;
  }
  interface TypographyOptions {
    fontFeatureSettings: string;
  }
}

const headingFontStyles: TypographyStyle = {
  fontWeight: 800,
  letterSpacing: "-0.0375em",
  lineHeight: 1.2,
};

const subtitleFontStyles: TypographyStyle = {
  lineHeight: 1.1,
  fontWeight: 500,
};

export function muiTypography({
  locale,
}: {
  locale: Language | undefined;
}): ThemeOptions["typography"] {
  let fontFeatureSettings: string;
  switch (locale) {
    case "zh":
    case "ja":
      fontFeatureSettings = fonts.SANS_SERIF_FEATURE_SETTINGS_CJK;
      break;
    case "en":
    default:
      fontFeatureSettings = fonts.SANS_SERIF_FEATURE_SETTINGS;
      break;
  }

  const baseFontStyles: TypographyStyle = {
    fontFeatureSettings,
  };

  return {
    fontFamily: fonts.SANS_SERIF,
    // fontSize: 12,
    fontFeatureSettings,
    body1: {
      ...baseFontStyles,
      fontSize: "0.875rem",
    },
    body2: {
      ...baseFontStyles,
      fontSize: "0.75rem",
    },
    button: {
      ...baseFontStyles,
      textTransform: "none",
      fontWeight: 700,
      letterSpacing: "-0.025em",
      fontSize: "0.75rem",
    },
    overline: {
      ...baseFontStyles,
      letterSpacing: "0.05em",
      fontSize: "0.625rem",
      lineHeight: "1.5",
    },
    caption: {
      ...baseFontStyles,
      fontSize: "0.625rem",
    },
    h1: { ...headingFontStyles, fontSize: "2.488rem" },
    h2: { ...headingFontStyles, fontSize: "2.074rem" },
    h3: { ...headingFontStyles, fontSize: "1.728rem" },
    h4: { ...headingFontStyles, fontSize: "1.44rem" },
    h5: { ...headingFontStyles, fontSize: "1.2rem" },
    h6: { ...headingFontStyles, fontSize: "1rem" },
    subtitle1: { ...subtitleFontStyles, fontSize: "0.875rem" },
    subtitle2: { ...subtitleFontStyles, fontSize: "0.75rem" },
  };
}
