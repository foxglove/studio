// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { CSSObject } from "@emotion/react";
import { Theme } from "@mui/material";
import tc from "tinycolor2";

import { OverrideComponentReturn } from "../types";

export const MuiScopedCssBaseline: OverrideComponentReturn<"MuiScopedCssBaseline"> = {
  styleOverrides: {
    root: ({ theme }) => ({
      // container styling
      height: "100%",
      width: "100%",
      display: "flex",
      flexDirection: "column",
      position: "relative",
      flex: "1 1 100%",
      overflow: "hidden",
      background: theme.palette.background.default,
      color: theme.palette.text.primary,
      font: "inherit",
      fontSize: theme.typography.body2.fontSize,
      fontFeatureSettings: theme.typography.fontFeatureSettings,
      fontFamily: theme.typography.body2.fontFamily,
      fontWeight: theme.typography.body2.fontWeight,
      lineHeight: theme.typography.body2.lineHeight,
      zIndex: 0,

      // Prevent scroll "bouncing" since the app workspace is not scrollable. Allows individual
      // scrollable elements to be scrolled without the whole page moving (even if they don't
      // preventDefault on scroll events).
      overscrollBehavior: "none",

      /// --- child and element styling follows ---
      "code, pre, tt": {
        fontFamily: theme.typography.fontMonospace,
        overflowWrap: "break-word",
      },
      mark: {
        color: theme.palette.info.main,
        fontWeight: 700,
        backgroundColor: "transparent",
      },
      div: {
        "::-webkit-scrollbar": {
          width: 6,
          height: 6,
        },
        "::-webkit-scrollbar-corner": {
          background: "transparent",
        },
        "::-webkit-scrollbar-track": {
          background: "transparent",
        },
        "::-webkit-scrollbar-thumb": {
          background: theme.palette.action.focus,
          borderRadius: 0,
        },
      },
      "p:not([class^='Mui'])": {
        marginBlock: "0.5rem",

        "&:last-child": {
          marginBottom: 0,
        },
      },
      "h1, h2, h3, h4, h5, h6": {
        "&:not([class^='Mui'])": {
          marginBlock: "0.75em",

          "&:last-child": {
            marginBottom: 0,
          },
        },
      },
      "b, strong": {
        fontWeight: 700,
      },
      canvas: {
        outline: "none",
      },
      ...mosaicStyles(theme),
      ...leafletStyles(theme),
    }),
  },
};

const mosaicStyles = (theme: Theme): CSSObject => ({
  ".mosaic": {
    ".mosaic-root": {
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,

      ".drop-target-container .drop-target": {
        backgroundColor: theme.palette.action.hover,
        border: `2px solid ${tc(theme.palette.divider).setAlpha(0.5).toString()}`,
      },
      ".drop-target-container .drop-target-hover": {
        opacity: 1,
      },
    },
    ".mosaic-tile": {
      margin: 0,
    },
    ".mosaic-tile:first-of-type": {
      // make room for splitters - unfortunately this means the background color will show
      // through even if the tile has its own background color set
      gap: 1,
    },
    // The last tile does not need a bottom margin
    ".mosaic-tile:last-child": {
      marginBottom: 0,
    },
    // If there is only one tile in the container there are no splitters and no margin is needed
    ".mosaic-tile:only-child": {
      margin: 0,
    },
    // tile immediately after a row splitter needs 1px margin so the splitter doesn't overlap the tile content
    ".-row + .mosaic-tile": {
      gap: 1,
    },
    // tile immediately after a column splitter needs 1px margin so the splitter doesn't overlap the tile content
    ".-column + .mosaic-tile": {
      gap: 1,
    },
    ".mosaic-window": {
      boxShadow: "none",
      width: "100%",

      // we use custom toolbars
      ".mosaic-window-toolbar": {
        display: "none",
      },
      ".mosaic-window-body": {
        flex: "1 1 auto",
        display: "flex",
        background: "unset",
        zIndex: "unset",
      },
    },
    ".mosaic-preview": {
      maxHeight: "none",

      // we use custom toolbars
      ".mosaic-window-toolbar": {
        display: "none",
      },
      ".mosaic-window-body": {
        flex: "1 1 auto",
        display: "flex",
        background: "unset",
        zIndex: "unset",
      },
    },
    ".mosaic-window-toolbar": {
      display: "none",
    },
    ".mosaic-window-body": {
      flex: "1 1 auto",
      display: "flex",
      background: "unset",
      zIndex: "unset",
    },
    ".mosaic-window-title": {
      fontSize: 12,
      lineHeight: "30px",
      paddingLeft: 5,
    },
    ".mosaic-split": {
      background: "none !important",
      zIndex: 99,

      ".mosaic-split-line": {
        boxShadow: `0 0 0 1px ${theme.palette.divider}`,
      },
      "&:hover .mosaic-split-line": {
        boxShadow: `0 0 0 1px ${
          theme.palette.mode === "dark"
            ? tc(theme.palette.divider).lighten().toHexString()
            : tc(theme.palette.divider).darken().toHexString()
        }`,
      },
    },
    "&.borderless": {
      ".mosaic-split": {
        opacity: 0,

        "&:hover": {
          opacity: 1,
        },
      },
      ".mosaic-tile": {
        margin: 0,
      },
    },
  },
});

const leafletStyles = (theme: Theme): CSSObject => ({
  ".leaflet-bar": {
    userSelect: "none",
    backgroundColor: theme.palette.background.paper,
    borderRadius: 4,

    a: {
      lineHeight: 1.2,
      backgroundColor: "transparent",
      color: theme.palette.text.primary,
      borderBottomColor: theme.palette.divider,

      "&:hover": {
        backgroundColor: theme.palette.action.hover,
        color: theme.palette.text.primary,
        borderBottomColor: theme.palette.divider,
      },
      "&:focus": {
        color: theme.palette.text.primary,
      },
      "&:active": {
        color: theme.palette.text.primary,
      },
    },
  },
  ".leaflet-bar a.leaflet-disabled": {
    backgroundColor: theme.palette.action.disabledBackground,
    color: theme.palette.text.disabled,

    "&:hover": {
      backgroundColor: theme.palette.action.disabledBackground,
    },
  },
});
