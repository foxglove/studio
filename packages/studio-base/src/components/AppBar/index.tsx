// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { AppBar as MuiAppBar, Button, IconButton, Toolbar, Typography } from "@mui/material";
import { MouseEvent, useState } from "react";
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
import { useCurrentUser } from "@foxglove/studio-base/context/CurrentUserContext";
import ThemeProvider from "@foxglove/studio-base/theme/ThemeProvider";
import isDesktopApp from "@foxglove/studio-base/util/isDesktopApp";

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
    justifyContent: "space-evenly",
  },
  toolbarGroup: {
    display: "flex",
    flex: 1,
    alignItems: "center",
    gap: theme.spacing(0.5),
  },
  logo: {
    padding: 0,
    fontSize: "2.25rem",
    color: "#9480ed",
  },
  start: {
    marginInlineStart: theme.spacing(-2),
    justifySelf: "flex-start",
  },
  end: {
    flexDirection: "row-reverse",
    marginInlineEnd: theme.spacing(-2),
  },
}));

// const selectStartTime = (ctx: MessagePipelineContext) => ctx.playerState.activeData?.startTime;
// const selectEndTime = (ctx: MessagePipelineContext) => ctx.playerState.activeData?.endTime;
const selectPlayerName = (ctx: MessagePipelineContext) => ctx.playerState.name;
// const selectPlayerPresence = ({ playerState }: MessagePipelineContext) => playerState.presence;

export function AppBar(): JSX.Element {
  const { classes, cx } = useStyles();
  const { currentUser } = useCurrentUser();
  const playerName = useMessagePipeline(selectPlayerName);
  // const startTime = useMessagePipeline(selectStartTime);
  // const endTime = useMessagePipeline(selectEndTime);
  // const [currentUser] = useMe({ requireAuth: false });

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
            <div className={cx(classes.toolbarGroup, classes.start)}>
              <IconButton className={classes.logo} size="large" color="inherit">
                <FoxgloveLogo fontSize="inherit" color="inherit" />
              </IconButton>
              <Typography noWrap variant="h5" color="inherit" component="div">
                {currentUser?.org.displayName ?? "foxglove"}
              </Typography>
            </div>
            {playerName && <Typography variant="body2">{playerName}</Typography>}
            <div className={cx(classes.toolbarGroup, classes.end)}>
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
                <Button variant="contained" color="primary">
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
