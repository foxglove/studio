// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { ChevronRight12Regular, ErrorCircle20Filled } from "@fluentui/react-icons";
import { CircularProgress, IconButton, Typography } from "@mui/material";
import { MutableRefObject, memo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { makeStyles } from "tss-react/mui";

import {
  MessagePipelineContext,
  useMessagePipeline,
} from "@foxglove/studio-base/components/MessagePipeline";
import Stack from "@foxglove/studio-base/components/Stack";
import TextMiddleTruncate from "@foxglove/studio-base/components/TextMiddleTruncate";
import Timestamp from "@foxglove/studio-base/components/Timestamp";
import WssErrorModal from "@foxglove/studio-base/components/WssErrorModal";
import { useWorkspaceActions } from "@foxglove/studio-base/context/Workspace/useWorkspaceActions";
import { useAppTimeFormat } from "@foxglove/studio-base/hooks";
import { subtractTimes } from "@foxglove/studio-base/players/UserNodePlayer/nodeTransformerWorker/typescript/userUtils/time";
import { PlayerPresence } from "@foxglove/studio-base/players/types";
import { formatDuration } from "@foxglove/studio-base/util/formatTime";
import { fonts } from "@foxglove/studio-base/util/sharedStyleConstants";

const ICON_SIZE = 18;

const useStyles = makeStyles<void, "adornmentError">()((theme, _params, _classes) => ({
  chevron: {
    flex: "none",
  },
  sourceName: {
    font: "inherit",
    fontSize: theme.typography.body2.fontSize,
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(0.5),
    padding: theme.spacing(1.5),
    paddingInlineEnd: theme.spacing(0.75),
    whiteSpace: "nowrap",
    minWidth: 0,
  },
  adornment: {
    display: "flex",
    flex: "none",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    color: theme.palette.appBar.primary,
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
  adornmentError: {
    color: theme.palette.error.main,
  },
  spinner: {
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
    margin: "auto",
  },
  textTruncate: {
    maxWidth: "30vw",
    overflow: "hidden",
  },
  iconButton: {
    padding: 0,
    position: "relative",
    zIndex: 1,
    fontSize: ICON_SIZE - 2,

    "svg:not(.MuiSvgIcon-root)": {
      fontSize: "1rem",
    },
  },
}));

const selectPlay = (ctx: MessagePipelineContext) => ctx.startPlayback;
const selectPause = (ctx: MessagePipelineContext) => ctx.pausePlayback;
const selectSeek = (ctx: MessagePipelineContext) => ctx.seekPlayback;

const selectPlayerName = ({ playerState }: MessagePipelineContext) => playerState.name;
const selectPlayerPresence = ({ playerState }: MessagePipelineContext) => playerState.presence;
const selectPlayerProblems = ({ playerState }: MessagePipelineContext) => playerState.problems;

const selectStartTime = ({ playerState }: MessagePipelineContext) =>
  playerState.activeData?.startTime;
const selectEndTime = ({ playerState }: MessagePipelineContext) => playerState.activeData?.endTime;

type LiveDurationProps = {
  durationRef: MutableRefObject<ReactNull | HTMLDivElement>;
};

const LiveDuration = memo<LiveDurationProps>(function LiveDuration({
  durationRef,
}: LiveDurationProps) {
  return (
    <Typography
      variant="inherit"
      title="Duration"
      ref={durationRef}
      style={{
        fontFeatureSettings: `${fonts.SANS_SERIF_FEATURE_SETTINGS}, "zero"`,
      }}
    />
  );
});

export function DataSource(): JSX.Element {
  const { t } = useTranslation("appBar");
  const { classes, cx } = useStyles();
  const durationRef = useRef<HTMLDivElement>(ReactNull);

  const startTime = useMessagePipeline(selectStartTime);
  const endTime = useMessagePipeline(selectEndTime);

  const play = useMessagePipeline(selectPlay);
  const pause = useMessagePipeline(selectPause);
  const seek = useMessagePipeline(selectSeek);

  const isConnection = !(play && pause && seek);

  const playerName = useMessagePipeline(selectPlayerName);
  const playerPresence = useMessagePipeline(selectPlayerPresence);
  const playerProblems = useMessagePipeline(selectPlayerProblems) ?? [];

  const { sidebarActions } = useWorkspaceActions();
  const { formatDate, formatTime } = useAppTimeFormat();

  // We bypass react and update the DOM elements directly for better performance here.
  useEffect(() => {
    if (durationRef.current) {
      const duration = endTime && startTime ? subtractTimes(endTime, startTime) : undefined;
      if (duration) {
        const durationStr = formatDuration(duration);
        durationRef.current.innerText = durationStr;
      }
    }
  }, [endTime, formatTime, startTime, playerPresence, formatDate]);

  const reconnecting = playerPresence === PlayerPresence.RECONNECTING;
  const initializing = playerPresence === PlayerPresence.INITIALIZING;
  const error =
    playerPresence === PlayerPresence.ERROR ||
    playerProblems.some((problem) => problem.severity === "error");
  const loading = reconnecting || initializing;

  const playerDisplayName =
    initializing && playerName == undefined ? "Initializing..." : playerName;

  if (playerPresence === PlayerPresence.NOT_PRESENT) {
    return <div className={classes.sourceName}>{t("noDataSource")}</div>;
  }

  return (
    <>
      <WssErrorModal playerProblems={playerProblems} />
      <Stack direction="row" alignItems="center">
        <div className={classes.sourceName}>
          <div className={classes.textTruncate}>
            <TextMiddleTruncate text={playerDisplayName ?? `<${t("unknown")}>`} />
          </div>
          {!error && isConnection && startTime && (
            <>
              <ChevronRight12Regular className={classes.chevron} />
              <Timestamp title="Live since" horizontal time={startTime} />
              <ChevronRight12Regular className={classes.chevron} />
              <LiveDuration durationRef={durationRef} />
            </>
          )}
        </div>
        <div className={cx(classes.adornment, { [classes.adornmentError]: error })}>
          {loading && (
            <CircularProgress
              size={ICON_SIZE}
              color="inherit"
              className={classes.spinner}
              variant="indeterminate"
            />
          )}
          {error && (
            <IconButton
              color="inherit"
              className={classes.iconButton}
              onClick={() => {
                sidebarActions.left.setOpen(true);
                sidebarActions.left.selectItem("problems");
              }}
            >
              <ErrorCircle20Filled />
            </IconButton>
          )}
        </div>
      </Stack>
    </>
  );
}
