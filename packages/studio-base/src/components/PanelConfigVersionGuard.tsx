// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Card, CardContent, Paper, Typography } from "@mui/material";
import { ReactNode } from "react";
import { makeStyles } from "tss-react/mui";

type VersionedPanelConfig = Record<string, unknown> & { [VERSION_CONFIG_KEY]: number };

export const VERSION_CONFIG_KEY = "foxgloveConfigVersion";

function isVersionedPanelConfig(config: unknown): config is VersionedPanelConfig {
  return (
    config != undefined &&
    typeof config === "object" &&
    VERSION_CONFIG_KEY in config &&
    typeof config[VERSION_CONFIG_KEY] === "number"
  );
}

type Props = {
  highestSupportedVersion: number;
  children: ReactNode;
  config: unknown;
};

const useStyles = makeStyles()({
  root: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
});

/**
 * Wraps a panel and guarantees that the panel config is not of a version too
 * recent for the panel to render.
 */
export function PanelConfigVersionGuard(props: Props): JSX.Element {
  const { highestSupportedVersion, children, config } = props;

  const { classes } = useStyles();

  if (isVersionedPanelConfig(config) && config[VERSION_CONFIG_KEY] > highestSupportedVersion) {
    return (
      <Paper className={classes.root}>
        <Card>
          <CardContent>
            <Typography variant="subtitle1">
              This layout requires a more recent version of this panel.
            </Typography>
            <Typography variant="subtitle1">Please update to the latest version.</Typography>
          </CardContent>
        </Card>
      </Paper>
    );
  }

  return <>{children}</>;
}
