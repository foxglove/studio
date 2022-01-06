// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { makeStyles } from "@fluentui/react";
import tinycolor from "tinycolor2";

const usePlotStyles = makeStyles((theme) => ({
  dragger: {
    width: "2px",
    cursor: "ew-resize",
    padding: "2px 0 0",
    borderTop: `1px solid ${theme.palette.neutralLighter}`,
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    backgroundColor: theme.palette.neutralLighter,
  },
  root: {
    background: tinycolor(theme.palette.neutralLight).setAlpha(0.25).toRgbString(),
    color: theme.semanticColors.bodySubtext,
  },
  dropdown: {
    backgroundColor: "transparent !important",
    padding: "3px !important",
  },
  fullLengthButton: {
    background: tinycolor(theme.palette.neutralLight).setAlpha(0.5).toRgbString(),
    padding: 6,
    margin: 5,
    borderRadius: theme.effects.roundedCorner2,
    cursor: "pointer",
    textAlign: "center",

    ":hover": {
      background: tinycolor(theme.palette.neutralLight).setAlpha(0.75).toRgbString(),
    },
  },
  legendToggle: {
    padding: 6,
    cursor: "pointer",
    userSelect: "none",
    background: "transparent",

    ":hover": {
      background: tinycolor(theme.palette.neutralLight).setAlpha(0.5).toRgbString(),
    },
  },
  item: {
    display: "flex",
    padding: "0 5px",
    height: 20,
    lineHeight: 20,
    position: "relative",

    ":hover": {
      background: tinycolor(theme.palette.neutralLight).setAlpha(0.75).toRgbString(),

      "[data-item-remove]": {
        visibility: "initial",
      },
    },
  },
  itemIconContainer: {
    display: "inline-block",
    width: 22,
    height: 20,
    lineHeight: 0,
    cursor: "pointer",
    flexShrink: 0,

    ":hover": {
      background: theme.palette.neutralLight,
    },
  },
  itemIcon: {
    display: "inline-block",
    width: 15,
    borderBottom: "2px solid currentColor",
    height: 0,
    verticalAlign: "middle",
    position: "relative",
    top: "calc(50% - 1px)",
  },
  itemRemove: {
    visibility: "hidden",
    padding: "2px",
    cursor: "pointer",
    background: "transparent",

    ":hover": {
      background: tinycolor(theme.palette.neutralLight).setAlpha(0.75).toRgbString(),
    },
  },
  itemInput: {
    overflow: "hidden",
    display: "flex",
  },
  itemInputDisabled: {
    input: {
      textDecoration: "line-through",
    },
  },
}));

export default usePlotStyles;
