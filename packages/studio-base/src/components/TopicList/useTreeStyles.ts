// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

/* eslint-disable tss-unused-classes/unused-classes */

import { makeStyles } from "tss-react/mui";

export const useTreeStyles = makeStyles<void, "dragHandle" | "node">()((theme, _, classes) => ({
  root: {},
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

    ":hover": {
      [`& .${classes.node}`]: {
        background: theme.palette.action.hover,
      },
    },
    [`:not(:hover) .${classes.node} .${classes.dragHandle}`]: {
      visibility: "hidden",
    },
    ":focus": {
      outline: "none",

      [`.${classes.node}`]: {
        background: theme.palette.action.focus,

        "&.isSelected": {
          background: theme.palette.action.selected,
        },
      },
    },
  },
  content: {
    display: "flex",
    overflow: "hidden",
    flex: "auto",
  },
  node: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    height: "100%",
    boxShadow: `inset 0 -1px 0 0 ${theme.palette.divider}`,

    "&.willReceiveDrop": {
      background: theme.palette.action.focus,
    },
    "&.isSelected": {
      background: theme.palette.action.selected,
    },
    "&.isSelectedStart": {},
    "&.isSelectedEnd": {},
    "&.isSelectedStart.isSelectedEnd": {},
  },
  dragHandle: {
    opacity: 0.5,
    marginInline: theme.spacing(0.75),
  },
  stats: {
    display: "flex",
  },
}));
