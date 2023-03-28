// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { ErrorCircle20Filled, ChevronDown12Filled, Open16Filled } from "@fluentui/react-icons";
import { ButtonBase, CircularProgress, IconButton, Tooltip } from "@mui/material";
import { useState, useRef } from "react";
import { makeStyles } from "tss-react/mui";

import {
  APP_BAR_PRIMARY_COLOR,
  APP_BAR_HEIGHT,
} from "@foxglove/studio-base/components/AppBar/constants";
import { ProblemsList } from "@foxglove/studio-base/components/DataSourceSidebar/ProblemsList";
import {
  MessagePipelineContext,
  useMessagePipeline,
} from "@foxglove/studio-base/components/MessagePipeline";
import Stack from "@foxglove/studio-base/components/Stack";
import TextMiddleTruncate from "@foxglove/studio-base/components/TextMiddleTruncate";
import {
  LayoutState,
  useCurrentLayoutSelector,
} from "@foxglove/studio-base/context/CurrentLayoutContext";
import { PlayerPresence } from "@foxglove/studio-base/players/types";

import { LayoutMenu } from "./LayoutMenu";

const LEFT_ICON_SIZE = 19;

const useStyles = makeStyles<void, "adornmentError" | "openIcon">()((theme, _params, classes) => ({
  button: {
    font: "inherit",
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(0.5),
    padding: theme.spacing(1.5),
    minHeight: APP_BAR_HEIGHT,
    minWidth: 0,

    "&.Mui-disabled": {
      color: "currentColor",
      opacity: theme.palette.action.disabledOpacity,
    },
    ":not(:hover)": {
      opacity: 0.6,

      [`.${classes.openIcon}`]: {
        visibility: "hidden",
      },
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
  spinner: {
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
    margin: "auto",
  },
  divider: {
    opacity: 0.6,
  },
  playerName: {
    maxWidth: "20vw",
    overflow: "hidden",
  },
  openIcon: {
    opacity: 0.6,
  },
  iconButton: {
    padding: 0,

    "svg:not(.MuiSvgIcon-root)": {
      fontSize: "1em",
    },
  },
  errorIconButton: {
    position: "relative",
    zIndex: 1,
    fontSize: LEFT_ICON_SIZE - 1,
  },
  tooltip: {
    padding: 0,
  },
}));

const selectPlayerName = ({ playerState }: MessagePipelineContext) => playerState.name;
const selectPlayerPresence = ({ playerState }: MessagePipelineContext) => playerState.presence;
const selectPlayerProblems = ({ playerState }: MessagePipelineContext) => playerState.problems;
const selectLayoutId = ({ selectedLayout }: LayoutState) => selectedLayout?.id;

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
  const currentLayoutId = useCurrentLayoutSelector(selectLayoutId);

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
      <ButtonBase className={classes.button} color="inherit" onClick={onSelectDataSourceAction}>
        Open data source…
      </ButtonBase>
    );
  }

  return (
    <>
      {problemModal}
      <Stack direction="row" alignItems="center">
        <ButtonBase className={classes.button} onClick={onSelectDataSourceAction}>
          {loading || error ? (
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
                  title={
                    <ProblemsList problems={playerProblems} setProblemModal={setProblemModal} />
                  }
                >
                  <IconButton
                    color="inherit"
                    className={cx(classes.iconButton, classes.errorIconButton)}
                  >
                    <ErrorCircle20Filled />
                  </IconButton>
                </Tooltip>
              )}
            </div>
          ) : (
            <Open16Filled className={classes.openIcon} />
          )}
          <div className={classes.playerName}>
            <TextMiddleTruncate text={playerDisplayName ?? "<unknown>"} />
          </div>
        </ButtonBase>
        <span className={classes.divider}>/</span>
        <ButtonBase
          className={classes.button}
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
          <TextMiddleTruncate text={currentLayoutId} />
          <ChevronDown12Filled />
        </ButtonBase>
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
