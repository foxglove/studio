// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { ErrorCircle20Filled, Info16Regular, ChevronDown12Filled } from "@fluentui/react-icons";
import { IconButton, Button, Link, CircularProgress, Tooltip, Typography } from "@mui/material";
import { useState, useRef } from "react";
import { makeStyles } from "tss-react/mui";

import {
  APP_BAR_PRIMARY_COLOR,
  APP_BAR_FOREGROUND_COLOR,
} from "@foxglove/studio-base/components/AppBar/constants";
import { DataSourceInfoView } from "@foxglove/studio-base/components/DataSourceInfoView";
import { ProblemsList } from "@foxglove/studio-base/components/DataSourceSidebar/ProblemsList";
import {
  MessagePipelineContext,
  useMessagePipeline,
} from "@foxglove/studio-base/components/MessagePipeline";
import Stack from "@foxglove/studio-base/components/Stack";
import TextMiddleTruncate from "@foxglove/studio-base/components/TextMiddleTruncate";
import { PlayerPresence } from "@foxglove/studio-base/players/types";

import { LayoutMenu } from "./LayoutMenu";

const LEFT_ICON_SIZE = 19;

const useStyles = makeStyles()((theme) => ({
  link: {
    display: "flex",
    flex: "0 1 auto",
    alignItems: "center",
    gap: theme.spacing(0.5),
    color: APP_BAR_FOREGROUND_COLOR,
    padding: theme.spacing(0.5, 0.75),
    opacity: 0.8,

    ":hover": {
      opacity: 1,
    },
  },
  adornment: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    color: APP_BAR_PRIMARY_COLOR,
    width: LEFT_ICON_SIZE,
    height: LEFT_ICON_SIZE,
  },
  adornmentError: {
    color: theme.palette.error.main,
  },
  separator: {
    color: APP_BAR_FOREGROUND_COLOR,
    fontSize: theme.typography.body1.fontSize,
    opacity: 0.6,
  },
  spinner: {
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
    margin: "auto",
  },
  iconButton: {
    padding: 0,

    "svg:not(.MuiSvgIcon-root)": {
      fontSize: "1em",
    },
  },
  infoIconButton: {
    fontSize: LEFT_ICON_SIZE - 1,
  },
  errorIconButton: {
    position: "relative",
    zIndex: 1,
    fontSize: LEFT_ICON_SIZE - 1,
  },
  layoutIconButton: {
    fontSize: 12,
  },
  tooltip: {
    padding: 0,
  },
  zeroMinWidth: {
    minWidth: 0,
  },
}));

const selectPlayerName = ({ playerState }: MessagePipelineContext) => playerState.name;
const selectPlayerPresence = ({ playerState }: MessagePipelineContext) => playerState.presence;
const selectPlayerProblems = ({ playerState }: MessagePipelineContext) => playerState.problems;

export function DataSource({
  onSelectDataSourceAction,
  layoutMenuOpen,
  setLayoutMenuOpen,
  supportsAccountSettings,
}: {
  onSelectDataSourceAction: () => void;
  layoutMenuOpen: boolean;
  // eslint-disable-next-line @foxglove/no-boolean-parameters
  setLayoutMenuOpen: (open: boolean) => void;
  supportsAccountSettings: boolean;
}): JSX.Element {
  const { classes, cx } = useStyles();
  const playerName = useMessagePipeline(selectPlayerName);
  const playerPresence = useMessagePipeline(selectPlayerPresence);
  const playerProblems = useMessagePipeline(selectPlayerProblems) ?? [];

  const reconnecting = playerPresence === PlayerPresence.RECONNECTING;
  const initializing = playerPresence === PlayerPresence.INITIALIZING;
  const error =
    playerPresence === PlayerPresence.ERROR ||
    playerProblems.some((problem) => problem.severity === "error");
  const loading = reconnecting || initializing;

  const layoutButtonRef = useRef<HTMLButtonElement>(ReactNull);
  const layoutAnchorEl = layoutMenuOpen ? layoutButtonRef.current : undefined;

  const playerDisplayName =
    initializing && playerName == undefined ? "Initializing..." : playerName;

  const [problemModal, setProblemModal] = useState<JSX.Element | undefined>(undefined);

  if (playerPresence === PlayerPresence.NOT_PRESENT) {
    return (
      <Button size="small" color="inherit" variant="outlined" onClick={onSelectDataSourceAction}>
        <Typography noWrap variant="inherit" component="span">
          Open data source…
        </Typography>
      </Button>
    );
  }

  return (
    <>
      {problemModal}
      <Stack direction="row" alignItems="center" paddingRight={1.25}>
        <div className={cx(classes.adornment, { [classes.adornmentError]: error })}>
          {loading && (
            <CircularProgress
              size={LEFT_ICON_SIZE}
              color="inherit"
              className={classes.spinner}
              variant="indeterminate"
            />
          )}
          {error && (
            <Tooltip
              arrow={false}
              disableHoverListener={initializing}
              disableFocusListener={initializing}
              classes={{ tooltip: classes.tooltip }}
              placement="bottom"
              title={<ProblemsList problems={playerProblems} setProblemModal={setProblemModal} />}
            >
              <IconButton
                color="inherit"
                className={cx(classes.iconButton, classes.errorIconButton)}
              >
                <ErrorCircle20Filled />
              </IconButton>
            </Tooltip>
          )}
          {!loading && !error && (
            <Tooltip
              arrow={false}
              disableHoverListener={initializing}
              disableFocusListener={initializing}
              classes={{ tooltip: classes.tooltip }}
              placement="bottom"
              title={
                <Stack gap={1} padding={1}>
                  <DataSourceInfoView />
                </Stack>
              }
            >
              <IconButton
                className={cx(classes.iconButton, classes.infoIconButton)}
                color="inherit"
              >
                <Info16Regular />
              </IconButton>
            </Tooltip>
          )}
        </div>
        <Stack direction="row" alignItems="center" gap={0.25} overflow="hidden">
          <Link
            className={classes.link}
            color="inherit"
            underline="none"
            noWrap
            variant="body2"
            component="span"
            onClick={onSelectDataSourceAction}
          >
            <TextMiddleTruncate
              className={classes.zeroMinWidth}
              text={playerDisplayName ?? "<unknown>"}
            />
          </Link>
          <span className={classes.separator}>/</span>
          <Link
            className={classes.link}
            color="inherit"
            underline="none"
            variant="body2"
            component="span"
            ref={layoutButtonRef}
            id="layout-button"
            title="Layouts"
            aria-controls={layoutMenuOpen ? "layout-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={layoutMenuOpen ? "true" : undefined}
            onClick={() => {
              setLayoutMenuOpen(true);
            }}
          >
            <TextMiddleTruncate className={classes.zeroMinWidth} text="Layout name" />
            <IconButton
              color="inherit"
              className={cx(classes.iconButton, classes.layoutIconButton)}
            >
              <ChevronDown12Filled />
            </IconButton>
          </Link>
        </Stack>
      </Stack>
      <LayoutMenu
        anchorEl={layoutAnchorEl ?? undefined}
        open={layoutMenuOpen}
        handleClose={() => setLayoutMenuOpen(false)}
        supportsSignIn={supportsAccountSettings}
      />
    </>
  );
}
