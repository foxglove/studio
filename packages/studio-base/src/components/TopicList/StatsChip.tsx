// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Divider, Paper } from "@mui/material";
import { makeStyles } from "tss-react/mui";

const useStyles = makeStyles()((theme) => ({
  root: {
    display: "flex",
    borderColor: theme.palette.action.selected,
    borderRadius: "1em",
    color: theme.palette.text.secondary,
    backgroundColor: theme.palette.background.paper,

    [`@container (max-width: 375px)`]: {
      display: "none",
    },
  },
  stat: {
    minWidth: 24,
    textAlign: "center",
    fontSize: theme.typography.caption.fontSize,
    color: theme.palette.text.secondary,
    padding: theme.spacing(0.25, 0.75),
  },
  divider: {
    borderColor: theme.palette.action.selected,
  },
}));

export function StatsChip({ topicName }: { topicName: string }): JSX.Element {
  const { classes } = useStyles();
  return (
    <Paper variant="outlined" className={classes.root}>
      <div className={classes.stat} data-topic={topicName} data-topic-stat="frequency">
        &ndash;
      </div>
      <Divider className={classes.divider} orientation="vertical" flexItem />
      <div className={classes.stat} data-topic={topicName} data-topic-stat="count">
        &ndash;
      </div>
    </Paper>
  );
}
