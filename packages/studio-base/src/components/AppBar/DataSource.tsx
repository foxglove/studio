// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  BarcodeScanner20Regular,
  Cloud16Regular,
  Document16Regular,
  Flow16Regular,
} from "@fluentui/react-icons";
import { FileASPXIcon } from "@fluentui/react-icons-mdl2";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import { ButtonBase, Typography } from "@mui/material";
import { useMemo } from "react";

import {
  MessagePipelineContext,
  useMessagePipeline,
} from "@foxglove/studio-base/components/MessagePipeline";
import Stack from "@foxglove/studio-base/components/Stack";
import { PlayerPresence } from "@foxglove/studio-base/players/types";

const selectPlayerName = ({ playerState }: MessagePipelineContext) => playerState.name;
// const selectProfile = ({ playerState }: MessagePipelineContext) => playerState.profile;
const selectPlayerPresence = ({ playerState }: MessagePipelineContext) => playerState.presence;
// const selectPlayerProblems = ({ playerState }: MessagePipelineContext) => playerState.problems;
const selectPlayerSourceId = ({ playerState }: MessagePipelineContext) =>
  playerState.urlState?.sourceId;

export function DataSource({
  onSelectDataSourceAction,
}: {
  onSelectDataSourceAction: () => void;
}): JSX.Element {
  const playerName = useMessagePipeline(selectPlayerName);
  const playerPresence = useMessagePipeline(selectPlayerPresence);
  // const playerProfile = useMessagePipeline(selectProfile);
  // const playerProblems = useMessagePipeline(selectPlayerProblems) ?? [];
  const playerSourceId = useMessagePipeline(selectPlayerSourceId);

  const currentSource = useMemo(() => {
    switch (playerSourceId) {
      // Data platform
      case "foxglove-data-platform":
        return { label: "Data Platform", icon: <Cloud16Regular /> };

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
  if (playerName == undefined) {
    return <></>;
  }

  if (playerPresence === PlayerPresence.INITIALIZING) {
    <Typography variant="inherit" component="span">
      Initializing connection
    </Typography>;
  }

  if (playerPresence === PlayerPresence.RECONNECTING) {
    return (
      <ButtonBase onClick={onSelectDataSourceAction}>
        <Typography variant="inherit" component="span">
          Listening on {playerName}
        </Typography>
      </ButtonBase>
    );
  }

  return (
    <ButtonBase onClick={onSelectDataSourceAction}>
      <Stack direction="row" alignItems="center" gap={1}>
        {currentSource != undefined && (
          <Stack direction="row" alignItems="center" gap={0.5}>
            {currentSource.icon}
            {currentSource.label}
            <ArrowRightIcon color="inherit" />
          </Stack>
        )}
        <Typography variant="inherit" component="span">
          {playerName}
        </Typography>
      </Stack>
    </ButtonBase>
  );
}
