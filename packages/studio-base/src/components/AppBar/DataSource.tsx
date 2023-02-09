// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ErrorIcon from "@mui/icons-material/Error";
import { ButtonBase, CircularProgress, Tooltip, Typography } from "@mui/material";
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

const useStyles = makeStyles()((theme) => ({
  root: {
    padding: theme.spacing(0, 1),
    font: "inherit",
    overflow: "hidden",
    maxWidth: "100%",

    "&:not(:hover)": { opacity: 0.8 },
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

const selectPlayerName = ({ playerState }: MessagePipelineContext) => playerState.name;
const selectPlayerPresence = ({ playerState }: MessagePipelineContext) => playerState.presence;
const selectPlayerProblems = ({ playerState }: MessagePipelineContext) => playerState.problems;

export function DataSource({
  onSelectDataSourceAction,
}: {
  onSelectDataSourceAction: () => void;
}): JSX.Element {
  const { classes } = useStyles();
  const playerName = useMessagePipeline(selectPlayerName) ?? "<unknown>";
  const playerPresence = useMessagePipeline(selectPlayerPresence);
  const playerProblems = useMessagePipeline(selectPlayerProblems) ?? [];

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
          <Stack gap={1} padding={1}>
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
