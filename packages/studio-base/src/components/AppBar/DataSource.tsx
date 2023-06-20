// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { ErrorCircle20Filled } from "@fluentui/react-icons";
import { CircularProgress, IconButton, Typography } from "@mui/material";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { makeStyles } from "tss-react/mui";

import { AppSetting } from "@foxglove/studio-base/AppSetting";
import {
  MessagePipelineContext,
  useMessagePipeline,
} from "@foxglove/studio-base/components/MessagePipeline";
import Stack from "@foxglove/studio-base/components/Stack";
import TextMiddleTruncate from "@foxglove/studio-base/components/TextMiddleTruncate";
import WssErrorModal from "@foxglove/studio-base/components/WssErrorModal";
import { useWorkspaceActions } from "@foxglove/studio-base/context/Workspace/useWorkspaceActions";
import { useAppConfigurationValue, useAppTimeFormat } from "@foxglove/studio-base/hooks";
import { PlayerPresence } from "@foxglove/studio-base/players/types";
import { format } from "@foxglove/studio-base/util/formatTime";
import { fonts } from "@foxglove/studio-base/util/sharedStyleConstants";
import { formatTimeRaw, isAbsoluteTime } from "@foxglove/studio-base/util/time";

const ICON_SIZE = 18;

const useStyles = makeStyles<void, "adornmentError">()((theme, _params, _classes) => ({
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

const selectPlayerSourceId = (ctx: MessagePipelineContext) => ctx.playerState.urlState?.sourceId;
const selectPlayerName = (ctx: MessagePipelineContext) => ctx.playerState.name;
const selectPlayerPresence = (ctx: MessagePipelineContext) => ctx.playerState.presence;
const selectPlayerProblems = (ctx: MessagePipelineContext) => ctx.playerState.problems;

const selectEndTime = (ctx: MessagePipelineContext) => ctx.playerState.activeData?.endTime;

const EndTimestamp = (): JSX.Element | ReactNull => {
  const endTime = useMessagePipeline(selectEndTime);
  const [timezone] = useAppConfigurationValue<string>(AppSetting.TIMEZONE);
  const { timeFormat } = useAppTimeFormat();

  const timeString = useMemo(() => {
    if (endTime == undefined) {
      return "";
    }
    const timeOfDayString = format(endTime, timezone);
    const timeRawString = formatTimeRaw(endTime);

    return timeFormat === "SEC" || !isAbsoluteTime(endTime) ? timeRawString : timeOfDayString;
  }, [endTime, timeFormat, timezone]);

  if (endTime == undefined) {
    return ReactNull;
  }
  return (
    <>
      <span>/</span>
      <Typography
        variant="inherit"
        title="Duration"
        style={{
          fontFeatureSettings: `${fonts.SANS_SERIF_FEATURE_SETTINGS}, "zero"`,
        }}
      >
        {timeString}
      </Typography>
    </>
  );
};

export function DataSource(): JSX.Element {
  const { t } = useTranslation("appBar");
  const { classes, cx } = useStyles();

  const playerSourceId = useMessagePipeline(selectPlayerSourceId);
  const playerName = useMessagePipeline(selectPlayerName);
  const playerPresence = useMessagePipeline(selectPlayerPresence);
  const playerProblems = useMessagePipeline(selectPlayerProblems) ?? [];

  const isLiveConnection =
    playerSourceId != undefined
      ? playerSourceId.endsWith("socket") ||
        playerSourceId.endsWith("lidar") ||
        playerSourceId.endsWith("device")
      : false;

  const { sidebarActions } = useWorkspaceActions();

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
          {isLiveConnection && <EndTimestamp />}
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
