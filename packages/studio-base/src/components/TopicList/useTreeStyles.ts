// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import tc from "tinycolor2";
import { makeStyles } from "tss-react/mui";

type TreeClasses = "dragHandle" | "node";

export const useTreeStyles = makeStyles<void, TreeClasses>()((theme, _, classes) => ({
  /* eslint-disable tss-unused-classes/unused-classes */
  root: {
    containerType: "inline-size",
  },
  aliasedTopicName: {
    color: theme.palette.primary.main,
    display: "block",
    textAlign: "start",
  },
  icon: {
    alignItems: "center",
    justifyContent: "center",
    display: "flex",
    padding: theme.spacing(0.75),
  },
  row: {
    whiteSpace: "nowrap",
    cursor: "pointer",

    [`:not(:hover) .${classes.node} .${classes.dragHandle}`]: {
      visibility: "hidden",
    },
    ":focus": {
      outline: "none",

      [`& .${classes.node}`]: {
        outline: `1px solid ${theme.palette.primary.main}`,
        outlineOffset: -1,

        [`.${classes.dragHandle}`]: {
          visibility: "visible",
        },
      },
    },
  },
  /* eslint-enable tss-unused-classes/unused-classes */
  node: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    height: "100%",
    gap: theme.spacing(0.75),
    paddingRight: theme.spacing(0.75),
    backgroundColor: theme.palette.background.paper,
    borderTop: `1px solid ${theme.palette.action.selected}`,

    "&.willReceiveDrop": {
      background: theme.palette.action.focus,
    },
    "&:not(.isTopLevel)": {
      borderTop: `1px solid ${theme.palette.background.paper}`,
      backgroundColor: theme.palette.action.hover,
    },
    "&.isSelected": {
      backgroundColor: theme.palette.action.selected,
    },
    "&.isSelectedStart": {},
    "&.isSelectedEnd": {},
    "&.isSelectedStart.isSelectedEnd": {},
    "&.isDragging:active": {
      backgroundColor: tc(theme.palette.primary.main)
        .setAlpha(theme.palette.action.hoverOpacity)
        .toRgbString(),
      outline: `1px solid ${theme.palette.primary.main}`,
      outlineOffset: -1,
      borderRadius: theme.shape.borderRadius,
    },
  },
  dragHandle: {
    opacity: 0.6,
    cursor: "grab",
  },
}));
