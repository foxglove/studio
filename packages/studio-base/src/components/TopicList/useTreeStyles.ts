// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

/* eslint-disable tss-unused-classes/unused-classes */

import { makeStyles } from "tss-react/mui";

export const useTreeStyles = makeStyles<void, "dragHandle" | "node" | "stats">()(
  (theme, _, classes) => ({
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
      boxSizing: "border-box",
      whiteSpace: "nowrap",
      cursor: "pointer",
      borderBottom: `thin solid ${theme.palette.divider}`,

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
      },
      [`@container (max-width: 375px)`]: {
        [`.${classes.stats}`]: {
          display: "none",
        },
      },
    },
    node: {
      position: "relative",
      display: "flex",
      alignItems: "center",
      height: "100%",
      gap: theme.spacing(0.75),
      paddingRight: theme.spacing(0.75),

      "&.willReceiveDrop": {
        background: theme.palette.action.focus,
      },
      "&.isSelected": {
        // background: theme.palette.action.selected,
      },
      "&:not(.isTopLevel)": {
        backgroundColor:
          theme.palette.mode === "dark" ? theme.palette.grey[500] : theme.palette.grey[50],
      },
      "&.isSelectedStart": {},
      "&.isSelectedEnd": {},
      "&.isSelectedStart.isSelectedEnd": {},
    },
    dragHandle: {
      opacity: 0.5,
    },
    stats: {
      display: "flex",
    },
  }),
);
