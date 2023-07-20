// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

/// <reference types="webpack/module" />

import CloseIcon from "@mui/icons-material/Close";
import {
  Button,
  IconButton,
  Link,
  ThemeProvider as MuiThemeProvider,
  Portal,
  Typography,
  alpha,
} from "@mui/material";
import { useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { CSSTransition } from "react-transition-group";
import { useAsync } from "react-use";
import { makeStyles } from "tss-react/mui";
import { create } from "zustand";

import Logger from "@foxglove/log";
import { Language } from "@foxglove/studio-base/i18n";
import { createMuiTheme } from "@foxglove/studio-base/theme";

import { APP_MANIFEST_FILENAME, AppManifest } from "./AppManifest";

const log = Logger.getLogger(__filename);

export const useAppOutdatedState = create(() => ({
  bannerShown: false,
}));

const TRANSITION_DURATION_MS = 500;

const useStyles = makeStyles()((theme, _params) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    backgroundColor: alpha(theme.palette.common.black, 0.4),
    color: theme.palette.primary.contrastText,
    boxSizing: "border-box",
    padding: theme.spacing(1, 1.5),
    gap: theme.spacing(1),
    position: "fixed",
    inset: 0,
    zIndex: theme.zIndex.modal + 1,
    backdropFilter: "blur(12px)",
  },
  rootEnter: {
    opacity: 0,
    transform: "scale(1.25)",
  },
  rootEnterActive: {
    opacity: 1,
    transform: "none",
    transition: `opacity ${TRANSITION_DURATION_MS}ms, transform ${TRANSITION_DURATION_MS}ms`,
  },
  rootExit: {
    opacity: 1,
    transform: "none",
  },
  rootExitActive: {
    opacity: 0,
    transform: "scale(1.25)",
    transition: `opacity ${TRANSITION_DURATION_MS}ms, transform ${TRANSITION_DURATION_MS}ms`,
  },
  closeButton: {
    position: "absolute",
    right: 0,
    top: 0,
    margin: theme.spacing(3),
  },
  versionInfo: {
    color: alpha(theme.palette.primary.contrastText, 0.5),
  },
}));

type Props = {
  overrideGetManifest?: () => Promise<AppManifest>;
};

function AppOutdatedBannerBase({ overrideGetManifest }: Props): JSX.Element {
  const { classes } = useStyles();
  const appManifest = useAsync(async (): Promise<AppManifest> => {
    try {
      if (overrideGetManifest != undefined) {
        return await overrideGetManifest();
      }
      return (await (
        await fetch(`${__webpack_public_path__}${APP_MANIFEST_FILENAME}`)
      ).json()) as AppManifest;
    } catch (err) {
      log.error("Failed to load manifest:", err);
      throw err;
    }
  });
  const rootRef = useRef<HTMLDivElement>(ReactNull);
  const { bannerShown } = useAppOutdatedState();

  let title: string;
  let subtitle: string;
  if (
    appManifest.value?.version != undefined &&
    appManifest.value.version !== FOXGLOVE_STUDIO_VERSION
  ) {
    title = "Foxglove Studio is out of date";
    subtitle = "Reload the app to use the latest version.";
  } else {
    title = "Foxglove Studio encountered an error";
    subtitle = "The application may need to be updated. Try reloading to use the latest version.";
  }
  return (
    <CSSTransition
      nodeRef={rootRef}
      unmountOnExit
      in={bannerShown}
      timeout={TRANSITION_DURATION_MS}
      classNames={{
        enter: classes.rootEnter,
        enterActive: classes.rootEnterActive,
        exit: classes.rootExit,
        exitActive: classes.rootExitActive,
      }}
    >
      <div className={classes.root} ref={rootRef}>
        <IconButton
          className={classes.closeButton}
          onClick={() => useAppOutdatedState.setState({ bannerShown: false })}
          edge="end"
        >
          <CloseIcon />
        </IconButton>
        <Typography variant="h4">{title}</Typography>
        <Typography variant="body1">{subtitle}</Typography>
        <Button
          color="inherit"
          variant="outlined"
          size="small"
          onClick={() => window.location.reload()}
        >
          Reload
        </Button>
        <Typography variant="caption" className={classes.versionInfo}>
          Current version: {FOXGLOVE_STUDIO_VERSION}
          {appManifest.value && (
            <>
              <br />
              Latest version: {appManifest.value.version}
              <br />
              <Link
                color="inherit"
                href="https://github.com/foxglove/studio/releases"
                target="_blank"
              >
                Release notes
              </Link>
            </>
          )}
          {appManifest.error && (
            <>
              <br />
              Latest version: unknown
            </>
          )}
        </Typography>
      </div>
    </CSSTransition>
  );
}

export function AppOutdatedBanner({ overrideGetManifest }: Props): JSX.Element {
  const { i18n } = useTranslation();
  const muiTheme = useMemo(
    () => createMuiTheme("dark", i18n.language as Language | undefined),
    [i18n.language],
  );

  return (
    <MuiThemeProvider theme={muiTheme}>
      <Portal>
        <AppOutdatedBannerBase overrideGetManifest={overrideGetManifest} />
      </Portal>
    </MuiThemeProvider>
  );
}
