// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  BarcodeScanner20Regular,
  Cloud20Regular,
  Document16Regular,
  Flow16Regular,
} from "@fluentui/react-icons";
import { FileASPXIcon } from "@fluentui/react-icons-mdl2";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import { ButtonBase, Typography } from "@mui/material";
import { useMemo } from "react";
import { makeStyles } from "tss-react/mui";

import {
  MessagePipelineContext,
  useMessagePipeline,
} from "@foxglove/studio-base/components/MessagePipeline";
import TextMiddleTruncate from "@foxglove/studio-base/components/TextMiddleTruncate";
import { PlayerPresence } from "@foxglove/studio-base/players/types";

const selectPlayerName = ({ playerState }: MessagePipelineContext) => playerState.name;
// const selectProfile = ({ playerState }: MessagePipelineContext) => playerState.profile;
const selectPlayerPresence = ({ playerState }: MessagePipelineContext) => playerState.presence;
// const selectPlayerProblems = ({ playerState }: MessagePipelineContext) => playerState.problems;
const selectPlayerSourceId = ({ playerState }: MessagePipelineContext) =>
  playerState.urlState?.sourceId;

const useStyles = makeStyles()((theme) => ({
  sourceLabel: {
    gridArea: "sourceLabel",

    [theme.breakpoints.down("md")]: {
      display: "none",
    },
  },
  icon: {
    gridArea: "icon",

    ".root-span": {
      display: "flex",
    },
    [theme.breakpoints.down("md")]: {
      display: "none",
    },
  },
  sourceInfo: {
    gridArea: "sourceInfo",
  },
  grid: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),

    [theme.breakpoints.up("md")]: {
      display: "grid",
      gridTemplateAreas: `"icon sourceLabel separator sourceInfo"`,
      gridTemplateColumns: "auto auto auto 1fr",
    },
  },
  separator: {
    gridArea: "separator",

    [theme.breakpoints.down("md")]: {
      display: "none",
    },
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
  // const playerProblems = useMessagePipeline(selectPlayerProblems) ?? [];
  const playerSourceId = useMessagePipeline(selectPlayerSourceId);

  const currentSource = useMemo(() => {
    switch (playerSourceId) {
      // Data platform
      case "foxglove-data-platform":
        return { label: "Data Platform", icon: <Cloud20Regular /> };

      // Files
      case "mcap-local-file":
        return { label: "MCAP", icon: <Document16Regular /> };
      case "ros1-local-bagfile":
        return { label: "ROS1", icon: <Document16Regular /> };
      case "ros2-local-bagfile":
        return { label: "ROS2", icon: <Document16Regular /> };
      case "ulog-local-file":
        return { label: "uLog", icon: <Document16Regular /> };
      case "sample-nuscenes":
        return { label: "Sample nuScenes", icon: <Document16Regular /> };

      // Remote file
      case "remote-file":
        return { label: "Remote URL", icon: <FileASPXIcon /> };

      // Socket too me
      case "ros1-socket":
        return { label: "ROS1 Websocket", icon: <Flow16Regular /> };
      case "ros2-socket":
        return { label: "ROS2 Websocket", icon: <Flow16Regular /> };
      case "rosbridge-websocket":
        return { label: "Rosbridge", icon: <Flow16Regular /> };
      case "foxglove-websocket":
        return { label: "Foxglove Websocket", icon: <Flow16Regular /> };

      case "velodyne-device":
        return { label: "Velodyne LIDAR", icon: <BarcodeScanner20Regular /> };
      default:
        return undefined;
    }
  }, [playerSourceId]);

  if (playerPresence === PlayerPresence.NOT_PRESENT) {
    return <></>;
  }

  if (playerPresence === PlayerPresence.INITIALIZING) {
    return (
      <Typography variant="inherit" component="span">
        Initializing connection
      </Typography>
    );
  }

  if (playerPresence === PlayerPresence.RECONNECTING) {
    return (
      <ButtonBase onClick={onSelectDataSourceAction}>
        <Typography noWrap variant="inherit" component="span">
          <TextMiddleTruncate text={`Listening on ${playerName}`} />
        </Typography>
      </ButtonBase>
    );
  }

  return (
    <ButtonBase onClick={onSelectDataSourceAction}>
      <div className={classes.grid}>
        {currentSource != undefined && (
          <>
            <div className={classes.icon}>{currentSource.icon}</div>
            <div className={classes.sourceLabel}>{currentSource.label}</div>
            <ArrowRightIcon className={classes.separator} color="inherit" />
          </>
        )}
        <Typography noWrap className={classes.sourceInfo} variant="inherit" component="span">
          <TextMiddleTruncate text={playerName} />
        </Typography>
      </div>
    </ButtonBase>
  );
}
