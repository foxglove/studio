// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { TypographyOptions, TypographyStyle } from "@mui/material/styles/createTypography";

import { Language } from "./types";

declare module "@mui/material/styles/createTypography" {
  interface Typography {
    fontMonospace: string;
    fontSansSerif: string;
    fontFeatureSettings: string;
  }
  interface TypographyOptions {
    fontMonospace: string;
    fontSansSerif: string;
    fontFeatureSettings: string;
  }
}

// We explicitly avoid fallback fonts (such as 'monospace') here to work around a bug in
// Chrome/Chromium on Windows that causes crashes when multiple Workers try to access fonts that
// have not yet been loaded. There is a race against the internal DirectWrite font cache which
// ends up crashing in DWriteFontFamily::GetFirstMatchingFont() or DWriteFont::Create().
//
// https://bugs.chromium.org/p/chromium/issues/detail?id=1261577
export const fontSansSerif = "'Inter'";
export const fontMonospace = "'IBM Plex Mono'";

// enable font features https://rsms.me/inter/lab
const fontFeatureSettingsLatin = "'cv08', 'cv10', 'tnum'";

// contextual alternates create undesired changes in Chinese/Japanese
const fontFeatureSettingsCJK = "'tnum'";

export function typography({ locale }: { locale: Language | undefined }): TypographyOptions {
  let fontFeatureSettings: string;
  switch (locale) {
    case "zh":
    case "ja":
      fontFeatureSettings = fontFeatureSettingsCJK;
      break;
    case "en":
    default:
      fontFeatureSettings = fontFeatureSettingsLatin;
      break;
  }
  const baseFontStyles: TypographyStyle = {
    fontFeatureSettings,
  };
  return {
    fontMonospace,
    fontSansSerif,
    fontFamily: fontSansSerif,
    fontSize: 12,
    fontFeatureSettings,
    body1: {
      ...baseFontStyles,
    },
    body2: {
      ...baseFontStyles,
    },
    button: {
      ...baseFontStyles,
      textTransform: "none",
      fontWeight: 700,
      letterSpacing: "-0.0125em",
    },
    overline: {
      ...baseFontStyles,
      letterSpacing: "0.05em",
      lineHeight: "1.5",
    },
    h1: { ...baseFontStyles, fontSize: "2rem" },
    h2: { ...baseFontStyles, fontSize: "1.8rem" },
    h3: { ...baseFontStyles, fontSize: "1.6rem" },
    h4: { ...baseFontStyles, fontSize: "1.2rem" },
    h5: { ...baseFontStyles, fontSize: "1.1rem" },
    h6: { ...baseFontStyles, fontSize: "1rem" },
  };
}
