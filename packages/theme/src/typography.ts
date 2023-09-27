// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { TypographyOptions } from "@mui/material/styles/createTypography";

import "./fonts/inter.css";
import "./fonts/plex-mono.css";

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

export const fontFeatureSettings = "'tnum'";

export const typography: TypographyOptions = {
  fontMonospace,
  fontSansSerif,
  fontFamily: fontSansSerif,
  fontSize: 12,
  fontFeatureSettings: "'tnum'",
  body1: { fontFeatureSettings, fontSize: "0.875rem" },
  body2: { fontFeatureSettings, fontSize: "0.75rem" },
  subtitle1: { fontFeatureSettings, fontSize: "0.875rem", fontWeight: 600 },
  subtitle2: { fontFeatureSettings, fontSize: "0.75rem", fontWeight: 600 },
  caption: { fontFeatureSettings, fontSize: "0.625rem" },
  button: {
    fontFeatureSettings,
    textTransform: "none",
    fontWeight: 700,
    letterSpacing: "-0.0125em",
  },
  overline: {
    fontFeatureSettings,
    fontSize: "0.6875rem",
    letterSpacing: "0.05em",
    lineHeight: "1.5",
  },
  h1: { fontFeatureSettings, fontSize: "2rem" },
  h2: { fontFeatureSettings, fontSize: "1.75rem" },
  h3: { fontFeatureSettings, fontSize: "1.5rem" },
  h4: { fontFeatureSettings, fontSize: "1.25rem" },
  h5: { fontFeatureSettings, fontSize: "1.125rem" },
  h6: { fontFeatureSettings, fontSize: "1rem" },
};
