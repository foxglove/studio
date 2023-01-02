// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { AppBar as MuiAppBar, Button, IconButton, Toolbar, Typography } from "@mui/material";
import { MouseEvent, useContext, useState } from "react";
import { makeStyles } from "tss-react/mui";

import {
  PreferencesDialog,
  PreferencesIconButton,
} from "@foxglove/studio-base/components/AppBar/Preferences";
import { FoxgloveLogo } from "@foxglove/studio-base/components/FoxgloveLogo";
import {
  MessagePipelineContext,
  useMessagePipeline,
} from "@foxglove/studio-base/components/MessagePipeline";
import { useAnalytics } from "@foxglove/studio-base/context/AnalyticsContext";
import ConsoleApiContext from "@foxglove/studio-base/context/ConsoleApiContext";
import { User } from "@foxglove/studio-base/context/CurrentUserContext";
import { AppEvent } from "@foxglove/studio-base/services/IAnalytics";
import ThemeProvider from "@foxglove/studio-base/theme/ThemeProvider";
// USEME: import isDesktopApp from "@foxglove/studio-base/util/isDesktopApp";

import { HelpIconButton, HelpMenu } from "./Help";
import { UserIconButton, UserMenu } from "./User";

const useStyles = makeStyles()((theme) => ({
  appBar: {
    gridArea: "appbar",
    boxShadow: "none",
    backgroundColor: theme.palette.common.black,
    color: theme.palette.common.white,
  },
  toolbar: {
    display: "grid",
    width: "100%",
    gridTemplateAreas: `"start middle end"`,
    gridTemplateColumns: "1fr auto 1fr",
  },
  logo: {
    padding: 0,
    fontSize: "2.25rem",
    color: "#9480ed",
  },
  start: {
    gridArea: "start",
    marginInlineStart: theme.spacing(-2),
    display: "flex",
    flex: 1,
    alignItems: "center",
    gap: theme.spacing(0.5),
  },
  middle: {
    gridArea: "middle",
    justifySelf: "center",
  },
  end: {
    gridArea: "end",
    display: "flex",
    flexDirection: "row-reverse",
    marginInlineEnd: theme.spacing(-2),
    flex: 1,
    alignItems: "center",
    gap: theme.spacing(0.5),
  },
}));

// const selectStartTime = (ctx: MessagePipelineContext) => ctx.playerState.activeData?.startTime;
// const selectEndTime = (ctx: MessagePipelineContext) => ctx.playerState.activeData?.endTime;
// const selectPlayerName = (ctx: MessagePipelineContext) => ctx.playerState.name;
// const selectPlayerPresence = ({ playerState }: MessagePipelineContext) => playerState.presence;

type AppBarProps = {
  // disableSignin?: boolean;
  currentUser?: User;
};

export function AppBar(props: AppBarProps): JSX.Element {
  const { currentUser } = props;
  const { classes } = useStyles();
  // const playerName = useMessagePipeline(selectPlayerName);
  // const startTime = useMessagePipeline(selectStartTime);
  // const endTime = useMessagePipeline(selectEndTime);
  const analytics = useAnalytics();

  // const supportsAccountSettings =
  //   useContext(ConsoleApiContext) != undefined && disableSignin !== true;

  const [helpAnchorEl, setHelAnchorEl] = useState<undefined | HTMLElement>(undefined);
  const [userAnchorEl, setUserAnchorEl] = useState<undefined | HTMLElement>(undefined);
  const [prefsDialogOpen, setPrefsDialogOpen] = useState(false);

  const helpMenuOpen = Boolean(helpAnchorEl);
  const userMenuOpen = Boolean(userAnchorEl);

  const handleHelpClick = (event: MouseEvent<HTMLElement>) => {
    setHelAnchorEl(event.currentTarget);
  };
  const handleHelpClose = () => {
    setHelAnchorEl(undefined);
  };

  const handleUserMenuClick = (event: MouseEvent<HTMLElement>) => {
    setUserAnchorEl(event.currentTarget);
  };
  const handleUserClose = () => {
    setUserAnchorEl(undefined);
  };

  const openPreferences = () => {
    setPrefsDialogOpen(true);
  };
  const closePreferences = () => {
    setPrefsDialogOpen(false);
  };

  return (
    <>
      <ThemeProvider isDark>
        <MuiAppBar className={classes.appBar} position="sticky" color="inherit" elevation={0}>
          <Toolbar variant="dense" className={classes.toolbar}>
            <div className={classes.start}>
              <IconButton className={classes.logo} size="large" color="inherit">
                <FoxgloveLogo fontSize="inherit" color="inherit" />
              </IconButton>
              {currentUser != undefined && (
                <Typography noWrap variant="h5" color="inherit" component="div">
                  {currentUser.org.displayName}
                </Typography>
              )}
            </div>

            {/* {playerName && (
              <Typography className={classes.middle} variant="body2">
                {playerName}
              </Typography>
            )} */}

            <div className={classes.end}>
              {currentUser ? (
                <UserIconButton
                  aria-label="User profile menu button"
                  color="inherit"
                  id="user-profile-button"
                  aria-controls={userMenuOpen ? "user-profile-menu" : undefined}
                  aria-haspopup="true"
                  aria-expanded={userMenuOpen ? "true" : undefined}
                  onClick={handleUserMenuClick}
                  size="small"
                />
              ) : (
                <Button
                  href="https://console.foxglove.dev/signin"
                  target="_blank"
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    void analytics.logEvent(AppEvent.DIALOG_CLICK_CTA, {
                      user: "unauthenticated",
                      cta: "create-account",
                    });
                  }}
                >
                  Sign up
                </Button>
              )}
              <PreferencesIconButton
                color="inherit"
                aria-label="Preferences dialog button"
                id="preferences-button"
                aria-controls={prefsDialogOpen ? "preferences-dialog" : undefined}
                aria-haspopup="true"
                aria-expanded={prefsDialogOpen ? "true" : undefined}
                onClick={openPreferences}
              />
              <HelpIconButton
                aria-label="Help menu button"
                color="inherit"
                id="help-button"
                aria-controls={helpMenuOpen ? "help-menu" : undefined}
                aria-haspopup="true"
                aria-expanded={helpMenuOpen ? "true" : undefined}
                onClick={handleHelpClick}
                size="large"
              />
            </div>
          </Toolbar>
        </MuiAppBar>
      </ThemeProvider>
      <HelpMenu anchorEl={helpAnchorEl} open={helpMenuOpen} handleClose={handleHelpClose} />
      <UserMenu anchorEl={userAnchorEl} open={userMenuOpen} handleClose={handleUserClose} />
      <PreferencesDialog
        id="preferences-dialog"
        open={prefsDialogOpen}
        onClose={closePreferences}
      />
    </>
  );
}
