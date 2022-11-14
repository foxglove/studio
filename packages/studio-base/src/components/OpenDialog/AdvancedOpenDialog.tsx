// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Dialog, List, ListItem, ListItemButton, ListItemText, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { makeStyles } from "tss-react/mui";

import { DataPlatform } from "@foxglove/studio-base/components/OpenDialog/DataPlatform";
import { LocalFile } from "@foxglove/studio-base/components/OpenDialog/LocalFile";
import { Samples } from "@foxglove/studio-base/components/OpenDialog/Samples";
import Stack from "@foxglove/studio-base/components/Stack";
import { usePlayerSelection } from "@foxglove/studio-base/context/PlayerSelectionContext";

type OpenDialogView = "file" | "demo" | "data-platform";

type OpenDialogProps = {
  onDismiss?: () => void;
};

const useStyles = makeStyles()((_theme) => ({
  drawer: {
    borderRight: "1px solid grey",
  },
}));

export function AdvancedOpenDialog(props: OpenDialogProps): JSX.Element {
  const { onDismiss } = props;
  const { availableSources } = usePlayerSelection();

  const [activeView, setActiveView] = useState<OpenDialogView>("file");

  const remoteFileSources = useMemo(() => {
    return availableSources.filter((source) => source.type === "remote-file");
  }, [availableSources]);

  const view = useMemo(() => {
    // fixme - use React.lazy to load heavy views like Data platform
    switch (activeView) {
      case "file": {
        return {
          component: <LocalFile availableSources={availableSources} />,
        };
      }
      case "demo": {
        return {
          component: <Samples availableSources={availableSources} />,
        };
      }
      case "data-platform": {
        return {
          component: <DataPlatform />,
        };
      }
      default:
        throw new Error(`Unknown view type: ${activeView}`);
    }
  }, [activeView, availableSources, remoteFileSources]);

  const { classes } = useStyles();

  return (
    <Dialog
      open
      onClose={onDismiss}
      fullWidth
      maxWidth="md"
      PaperProps={{
        elevation: 4,
        style: { width: "80%", height: "80%" },
      }}
    >
      <Stack direction="row" fullHeight>
        <Stack className={classes.drawer} fullHeight>
          <List>
            <ListItem onClick={() => setActiveView("file")} disablePadding>
              <ListItemButton selected={activeView === "file"}>
                <ListItemText>Local File</ListItemText>
              </ListItemButton>
            </ListItem>
            <ListItem onClick={() => setActiveView("data-platform")} disablePadding>
              <ListItemButton selected={activeView === "data-platform"}>
                <ListItemText>Foxglove Data Platform</ListItemText>
              </ListItemButton>
            </ListItem>
            <ListItem onClick={() => setActiveView("demo")} disablePadding>
              <ListItemButton selected={activeView === "demo"}>
                <ListItemText>Demos</ListItemText>
              </ListItemButton>
            </ListItem>
          </List>
          <Stack paddingX={2} paddingTop={2}>
            <Typography variant="overline" color="text.secondary">
              Connection
            </Typography>
          </Stack>
          <List>
            <ListItem disablePadding>
              <ListItemButton>
                <ListItemText>Foxglove Websocket</ListItemText>
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton>
                <ListItemText>Foxglove ROS Bridge</ListItemText>
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton>
                <ListItemText>Rosbridge</ListItemText>
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton>
                <ListItemText>ROS 1</ListItemText>
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton>
                <ListItemText>ROS 2</ListItemText>
              </ListItemButton>
            </ListItem>
          </List>
        </Stack>
        <Stack fullHeight>{view.component}</Stack>
      </Stack>
    </Dialog>
  );
}
