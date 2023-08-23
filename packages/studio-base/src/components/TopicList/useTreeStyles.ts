// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { makeStyles } from "tss-react/mui";

export const useTreeStyles = makeStyles<void, "dragHandle" | "node" | "stats">()(
  (theme, _, classes) => ({
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
      boxSizing: "border-box",
      whiteSpace: "nowrap",
      cursor: "pointer",
      backgroundColor: theme.palette.background.paper,

      ":hover": {},
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
    /* eslint-enable tss-unused-classes/unused-classes */
    node: {
      position: "relative",
      display: "flex",
      alignItems: "center",
      height: "100%",
      gap: theme.spacing(0.75),
      paddingRight: theme.spacing(0.75),
      boxShadow: `0 -1px 0 ${theme.palette.action.selected}`,

      "&.willReceiveDrop": {
        background: theme.palette.action.focus,
      },
      "&:not(.isTopLevel)": {
        boxShadow: `0 -1px 0 ${theme.palette.background.paper}`,
        backgroundColor: theme.palette.action.hover,
      },
      "&.isSelected": {},
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
