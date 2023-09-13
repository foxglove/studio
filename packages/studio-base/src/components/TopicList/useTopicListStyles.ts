// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { badgeClasses } from "@mui/material";
import tc from "tinycolor2";
import { makeStyles } from "tss-react/mui";

type TreeClasses = "dragHandle" | "row";

/* eslint-disable tss-unused-classes/unused-classes */
export const useTopicListStyles = makeStyles<void, TreeClasses>()((theme, _, classes) => ({
  root: {
    width: "100%",
    height: "100%",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    containerType: "inline-size",
  },
  filterBar: {
    top: 0,
    zIndex: theme.zIndex.appBar,
    padding: theme.spacing(0.5),
    position: "sticky",
    backgroundColor: theme.palette.background.paper,
  },
  filterStartAdornment: {
    display: "flex",
  },
  skeletonText: {
    marginTop: theme.spacing(0.5),
    marginBottom: theme.spacing(0.5),
  },
  aliasedTopicName: {
    color: theme.palette.primary.main,
    display: "block",
    textAlign: "start",
  },
  row: {
    display: "flex",
    alignItems: "center",
    whiteSpace: "nowrap",
    boxSizing: "border-box",
    position: "relative",
    height: "100%",
    gap: theme.spacing(0.75),
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(0.75),
    backgroundColor: theme.palette.background.paper,
    borderTop: `1px solid ${theme.palette.action.selected}`,
    marginRight: 1,

    [`:not(:hover) .${classes.dragHandle}`]: {
      visibility: "hidden",
    },
    ":focus": {
      outline: `1px solid ${theme.palette.primary.main}`,
      outlineOffset: -1,

      [`.${classes.dragHandle}`]: {
        visibility: "visible",
      },
    },
    [`&.isSelected`]: {
      // use opaque color for better drag preview
      backgroundColor: tc
        .mix(
          theme.palette.background.paper,
          theme.palette.primary.main,
          100 * theme.palette.action.selectedOpacity,
        )
        .toString(),

      ...(theme.palette.mode === "dark" && {
        ":after": {
          content: "''",
          position: "absolute",
          inset: "-1px 0 -1px 0",
          border: `1px solid ${theme.palette.primary.main}`,
        },
      }),
      [`& + .${classes.row}`]: {
        borderTop: `1px solid ${theme.palette.primary.main}`,
      },
    },
    [`&.isDragging:active`]: {
      // use opaque color for better drag preview
      backgroundColor: tc
        .mix(
          theme.palette.background.paper,
          theme.palette.primary.main,
          100 * theme.palette.action.selectedOpacity,
        )
        .toRgbString(),

      ...(theme.palette.mode === "dark" && {
        ":after": {
          content: "''",
          position: "absolute",
          inset: "-1px 0 -1px 0",
          border: `1px solid ${theme.palette.primary.main}`,
        },
      }),
      [`& + .${classes.row}`]: {
        borderTop: `1px solid ${theme.palette.primary.main}`,
      },
    },
  },
  fieldRow: {
    borderTop: `1px solid ${theme.palette.background.paper}`,
    backgroundColor: theme.palette.action.hover,
    // paddingLeft: theme.spacing(3),
  },
  dragHandle: {
    opacity: 0.6,
    cursor: "grab",

    ".isSelected &": {
      color: theme.palette.primary.main,
      opacity: 1,
    },
  },
  countBadge: {
    marginLeft: theme.spacing(-0.5),

    [`.${badgeClasses.badge}`]: {
      position: "relative",
      transform: "none",
    },
  },
  textContent: {
    maxWidth: "100%",
    userSelect: "text",
  },
}));
/* eslint-enable tss-unused-classes/unused-classes */
