// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { mergeStyles, useTheme } from "@fluentui/react";

import { MONOSPACE } from "@foxglove/studio-base/styles/fonts";

const ELEMENT_SELECTORS: string =
  ":global(html, body, div, span, applet, object, iframe, h1, h2, h3, h4, h5, h6, p, blockquote, pre, a, abbr, acronym, address, big, cite, code, del, dfn, em, img, ins, kbd, q, s, samp, small, strike, strong, sub, sup, tt, var, b, u, i, center, dl, dt, dd, ol, ul, li, fieldset, form, label, legend, table, caption, tbody, tfoot, thead, tr, th, td, article, aside, canvas, details, embed, figure, figcaption, footer, header, hgroup, menu, nav, output, ruby, section, summary, time, mark, audio, video)";
const ROLE_SELECTORS: string =
  ":global(article, aside, details, figcaption, figure, footer, header, hgroup, menu, nav, section)";

export default function CssBaseline(): ReactNull {
  const theme = useTheme();

  mergeStyles({
    // http://meyerweb.com/eric/tools/css/reset/
    // v2.0 | 20110126
    // License: none (public domain)
    [ELEMENT_SELECTORS]: {
      margin: 0,
      padding: 0,
      border: 0,
      font: "inherit",
      verticalAlign: "baseline",
    },
    /* HTML5 display-role reset for older browsers */
    [ROLE_SELECTORS]: {
      display: "block",
    },
    ":global(body)": {
      lineHeight: "1",
    },
    ":global(ol, ul)": {
      listStyle: "none",
    },
    ":global(blockquote, q)": {
      quotes: "none",
    },
    ":global(blockquote:before, blockquote:after, q:before, q:after)": {
      content: "none",
    },

    // Now our global styles
    ":global(html, body, #root)": {
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      position: "relative",
      flex: "1 1 100%",
      outline: "none",
      overflow: "hidden",
      background: theme.semanticColors.bodyBackground,
      color: theme.semanticColors.bodyText,
      ...theme.fonts.small,
    },
    ":global(#root)": {
      // ensure portals are able to stack on top of the main app
      zIndex: 0,
    },
    // Make sure everything uses box-sizing: border-box.
    // Per https://www.paulirish.com/2012/box-sizing-border-box-ftw/
    // When changing this, be aware that Mosaic also adds this by default.
    ":global(html)": {
      boxSizing: "border-box",
    },
    ":global(*, *:before, *:after)": {
      boxSizing: "inherit",
    },
    ":global(::selection)": {
      backgroundColor: theme.palette.blackTranslucent40,
    },
    ":global(code, pre, tt)": {
      fontFamily: MONOSPACE,
      overflowWrap: "break-word",
    },
    ":global(code)": {
      backgroundColor: theme.semanticColors.bodyBackgroundHovered,
      borderRadius: "0.2em",
      padding: "0 0.25em",
    },
    ":global(div)": {
      "::-webkit-scrollbar": {
        width: "4px",
        height: "4px",
      },
      "::-webkit-scrollbar-track": {
        background: "transparent",
      },
      "::-webkit-scrollbar-thumb": {
        background: "rgba(255, 255, 255, 0.1)",
        borderRadius: "2px",
      },
    },
    ":global(a)": {
      color: theme.semanticColors.link,

      ":hover": {
        color: theme.semanticColors.linkHovered,
      },
    },
    ":global(i, em)": {
      fontStyle: "italic",
    },
    ":global(b, strong)": {
      fontWeight: "bold",
      letterSpacing: "0.4px",
    },
    "global(p)": {
      margin: "1em 0",

      ":last-child": {
        marginBottom: "0",
      },
    },
    ":global(hr)": {
      border: "none",
      display: "block",
      height: "1px",
      margin: "0",
      padding: "0",
      backgroundColor: theme.semanticColors.bodyDivider,
    },
  });

  return ReactNull;
}
