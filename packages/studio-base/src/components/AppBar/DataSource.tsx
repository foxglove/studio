// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ErrorIcon from "@mui/icons-material/Error";
import { ButtonBase, CircularProgress, Tooltip, Typography } from "@mui/material";
import { useMemo } from "react";
import { makeStyles } from "tss-react/mui";

import { DataSourceInfoView } from "@foxglove/studio-base/components/DataSourceInfoView";
import { ProblemsList } from "@foxglove/studio-base/components/DataSourceSidebar/ProblemsList";
import {
  MessagePipelineContext,
  useMessagePipeline,
} from "@foxglove/studio-base/components/MessagePipeline";
import Stack from "@foxglove/studio-base/components/Stack";
import TextMiddleTruncate from "@foxglove/studio-base/components/TextMiddleTruncate";
import { PlayerPresence } from "@foxglove/studio-base/players/types";

const selectPlayerName = ({ playerState }: MessagePipelineContext) => playerState.name;
// const selectProfile = ({ playerState }: MessagePipelineContext) => playerState.profile;
const selectPlayerPresence = ({ playerState }: MessagePipelineContext) => playerState.presence;
const selectPlayerProblems = ({ playerState }: MessagePipelineContext) => playerState.problems;
const selectPlayerSourceId = ({ playerState }: MessagePipelineContext) =>
  playerState.urlState?.sourceId;

const useStyles = makeStyles()((theme) => ({
  root: {
    padding: theme.spacing(0, 1),
    font: "inherit",
    overflow: "hidden",
    maxWidth: "100%",

    "&:not(:hover)": {
      opacity: 0.8,
    },
  },
  sourceInfo: {
    gridArea: "sourceInfo",
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(0.5),
    whiteSpace: "nowrap",
    overflow: "hidden",
  },
  spinner: {
    flex: "none",
  },
  playerName: {
    minWidth: 0,
  },
}));

export function DataSource({
  onSelectDataSourceAction,
}: {
  onSelectDataSourceAction: () => void;
}): JSX.Element {
  const { classes } = useStyles();
  const playerName = useMessagePipeline(selectPlayerName) ?? "<unknown>";
  const playerPresence = useMessagePipeline(selectPlayerPresence);
  // const playerProfile = useMessagePipeline(selectProfile);
  const playerProblems = useMessagePipeline(selectPlayerProblems) ?? [];
  const playerSourceId = useMessagePipeline(selectPlayerSourceId);

  const currentSource = useMemo(() => {
    switch (playerSourceId) {
      // Data platform
      case "foxglove-data-platform":
        return "Foxglove Data Platform";

      // Files
      case "mcap-local-file":
        return "MCAP";
      case "ros1-local-bagfile":
        return "ROS1";
      case "ros2-local-bagfile":
        return "ROS2";
      case "ulog-local-file":
        return "uLog";

      // Remote file
      case "remote-file":
        return "Remote URL";

      // Socket too me
      case "ros1-socket":
        return "ROS1 Websocket";
      case "ros2-socket":
        return "ROS2 Websocket";
      case "rosbridge-websocket":
        return "Rosbridge";
      case "foxglove-websocket":
        return "Foxglove Websocket";

      // Other
      case "velodyne-device":
        return "Velodyne LIDAR";
      case "sample-nuscenes":
        return "Example Dataset";

      // Fallback
      default:
        return undefined;
    }
  }, [playerSourceId]);

  if (playerPresence === PlayerPresence.NOT_PRESENT) {
    return (
      <ButtonBase className={classes.root} onClick={onSelectDataSourceAction}>
        <Typography noWrap variant="inherit" component="span">
          Open a new connection…
        </Typography>
      </ButtonBase>
    );
  }

  if (playerPresence === PlayerPresence.INITIALIZING) {
    return (
      <Stack direction="row" alignItems="center" gap={1} paddingX={1}>
        <Typography noWrap variant="inherit" component="span">
          Initializing connection
        </Typography>
        <CircularProgress className={classes.spinner} size={16} variant="indeterminate" />
      </Stack>
    );
  }

  if (playerPresence === PlayerPresence.RECONNECTING) {
    return (
      <ButtonBase className={classes.root} onClick={onSelectDataSourceAction}>
        <Typography noWrap variant="inherit" component="span">
          <TextMiddleTruncate text={`Listening on ${playerName}`} />
        </Typography>
      </ButtonBase>
    );
  }

  return (
    <Tooltip
      title={
        <>
          <Stack gap={1} paddingTop={1}>
            {currentSource != undefined && (
              <Stack paddingX={2}>
                <Typography variant="overline" color="text.secondary">
                  Connection Type
                </Typography>
                <Typography variant="body2">{currentSource}</Typography>
              </Stack>
            )}
            <DataSourceInfoView />
            {playerProblems.length > 0 && <ProblemsList problems={playerProblems} />}
          </Stack>
        </>
      }
    >
      <ButtonBase className={classes.root} onClick={onSelectDataSourceAction}>
        <Stack direction="row" alignItems="center" gap={0.5} overflow="hidden">
          {playerProblems.length > 0 && <ErrorIcon color="error" fontSize="small" />}
          <div className={classes.sourceInfo}>
            <Typography noWrap variant="inherit" component="span">
              <TextMiddleTruncate className={classes.playerName} text={playerName} />
            </Typography>
          </div>
          <ArrowDropDownIcon />
        </Stack>
      </ButtonBase>
    </Tooltip>
  );
}
