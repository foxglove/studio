// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import { Divider, IconButton, Tab, Tabs } from "@mui/material";
import { makeStyles } from "tss-react/mui";

import { EventsList } from "@foxglove/studio-base/components/DataSourceSidebar/EventsList";
import {
  MessagePipelineContext,
  useMessagePipeline,
} from "@foxglove/studio-base/components/MessagePipeline";
import Stack from "@foxglove/studio-base/components/Stack";
import { TabPanel } from "@foxglove/studio-base/components/TabPanel";
import VariablesSidebar from "@foxglove/studio-base/components/VariablesSidebar";
import { useCurrentUser } from "@foxglove/studio-base/context/CurrentUserContext";

const useStyles = makeStyles()((theme) => ({
  root: {
    boxSizing: "content-box",
    borderLeft: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
  },
  tabs: {
    minHeight: "auto",
    flex: "1 1 auto",
    overflow: "hidden",
    paddingLeft: theme.spacing(0.25),

    ".MuiTabs-indicator": {
      transform: "scaleX(0.5)",
      height: 2,
      bottom: -1,
    },
    ".MuiTab-root": {
      minHeight: 30,
      minWidth: theme.spacing(4),
      padding: theme.spacing(0, 1),
      color: theme.palette.text.secondary,
      fontSize: "0.6875rem",

      "&.Mui-selected": {
        color: theme.palette.text.primary,
      },
    },
  },
  iconButton: {
    fontSize: 20,
    borderRadius: 0,
  },
}));

const selectPlayerSourceId = ({ playerState }: MessagePipelineContext) =>
  playerState.urlState?.sourceId;

export function SecondarySidebar({
  collapsed,
  toggleCollapsed,
  activeTab,
  setActiveTab,
}: {
  collapsed: boolean;
  toggleCollapsed: () => void;
  activeTab: number;
  setActiveTab: (newValue: number) => void;
}): JSX.Element {
  const { classes } = useStyles();
  const { currentUser } = useCurrentUser();

  const playerSourceId = useMessagePipeline(selectPlayerSourceId);

  const showEventsTab = currentUser != undefined && playerSourceId === "foxglove-data-platform";

  return (
    <Stack className={classes.root} flexShrink={0}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        {!collapsed && (
          <Tabs
            className={classes.tabs}
            textColor="inherit"
            value={activeTab}
            onChange={(_ev, newValue: number) => {
              if (newValue !== activeTab) {
                setActiveTab(newValue);
              }
            }}
          >
            <Tab label="Variables" value={0} />
            {showEventsTab && <Tab label="Events" value={1} />}
          </Tabs>
        )}

        <IconButton className={classes.iconButton} size="small" onClick={toggleCollapsed}>
          <ArrowRightIcon fontSize="inherit" />
        </IconButton>
      </Stack>
      <Divider />
      {!collapsed && (
        <>
          <TabPanel value={activeTab} index={0}>
            <VariablesSidebar />
          </TabPanel>
          {showEventsTab && (
            <TabPanel value={activeTab} index={1}>
              <EventsList />
            </TabPanel>
          )}
        </>
      )}
    </Stack>
  );
}
