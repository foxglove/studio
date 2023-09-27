// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { PropsWithChildren } from "react";
import { makeStyles } from "tss-react/mui";

import "@foxglove/studio-base/styles/assets/inter.css";
import "@foxglove/studio-base/styles/assets/plex-mono.css";

const useStyles = makeStyles()(({ palette, typography }) => ({
  root: {
    // container styling
    height: "100%",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    flex: "1 1 100%",
    overflow: "hidden",
    background: palette.background.default,
    color: palette.text.primary,
    font: "inherit",
    fontSize: typography.body2.fontSize,
    fontFeatureSettings: typography.fontFeatureSettings,
    fontFamily: typography.body2.fontFamily,
    fontWeight: typography.body2.fontWeight,
    zIndex: 0,

    // Prevent scroll "bouncing" since the app workspace is not scrollable. Allows individual
    // scrollable elements to be scrolled without the whole page moving (even if they don't
    // preventDefault on scroll events).
    overscrollBehavior: "none",

    // https://github.com/necolas/normalize.css/blob/master/normalize.css#L12
    lineHeight: 1.15,

    /// --- child and element styling follows ---
    "code, pre, tt": {
      fontFamily: typography.fontMonospace,
      overflowWrap: "break-word",
    },
    mark: {
      color: palette.info.main,
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
        background: palette.action.focus,
        borderRadius: 0,
      },
    },
    "p:not([class^='Mui')": {
      margin: "1em 0",

      "&:last-child": {
        marginBottom: 0,
      },
    },
    "b, strong": {
      fontWeight: 700,
    },
    canvas: {
      outline: "none",
    },
  },
}));

export default function CssBaseline(props: PropsWithChildren): JSX.Element {
  const { classes } = useStyles();

  return <div className={classes.root}>{props.children}</div>;
}
