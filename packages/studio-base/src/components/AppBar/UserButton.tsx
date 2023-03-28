// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Settings24Regular } from "@fluentui/react-icons";
import PersonIcon from "@mui/icons-material/Person";
import { Avatar, Button, IconButton, Tooltip } from "@mui/material";
import { SetStateAction, forwardRef } from "react";
import tinycolor from "tinycolor2";
import { makeStyles } from "tss-react/mui";

import { AppBarIconButton } from "@foxglove/studio-base/components/AppBar/AppBarIconButton";
import {
  APP_BAR_FOREGROUND_COLOR,
  APP_BAR_PRIMARY_COLOR,
} from "@foxglove/studio-base/components/AppBar/constants";
import Stack from "@foxglove/studio-base/components/Stack";
import { useAnalytics } from "@foxglove/studio-base/context/AnalyticsContext";
import { useCurrentUser } from "@foxglove/studio-base/context/CurrentUserContext";
import { AppEvent } from "@foxglove/studio-base/services/IAnalytics";

const useStyles = makeStyles()((theme) => ({
  tooltip: {
    marginTop: `${theme.spacing(0.5)} !important`,
  },
  avatar: {
    color: theme.palette.common.white,
    backgroundColor: APP_BAR_PRIMARY_COLOR,
    height: theme.spacing(3.5),
    width: theme.spacing(3.5),
  },
  iconButton: {
    padding: theme.spacing(1),
    borderRadius: 0,

    "&:hover": {
      backgroundColor: tinycolor(APP_BAR_FOREGROUND_COLOR).setAlpha(0.08).toRgbString(),
    },
    "&.Mui-selected": {
      backgroundColor: APP_BAR_PRIMARY_COLOR,
    },
  },
  userIconImage: {
    objectFit: "cover",
    width: "100%",
  },
  button: {
    marginInline: theme.spacing(1),
    backgroundColor: APP_BAR_PRIMARY_COLOR,

    "&:hover": {
      backgroundColor: theme.palette.augmentColor({
        color: { main: APP_BAR_PRIMARY_COLOR },
      }).dark,
    },
  },
}));

type UserButtonProps = {
  disableSignIn?: boolean;
  userMenuOpen: boolean;
  setUserAnchorEl: (value: SetStateAction<HTMLElement | undefined>) => void;
  prefsDialogOpen: boolean;
  // eslint-disable-next-line @foxglove/no-boolean-parameters
  setPrefsDialogOpen: (open: boolean) => void;
};

export const UserButton = forwardRef<HTMLButtonElement, UserButtonProps>((props, ref) => {
  const {
    disableSignIn = false,
    prefsDialogOpen,
    setPrefsDialogOpen,
    setUserAnchorEl,
    userMenuOpen,
  } = props;
  const { classes } = useStyles();
  const analytics = useAnalytics();
  const { currentUser, signIn } = useCurrentUser();

  if (currentUser != undefined) {
    return (
      <Tooltip classes={{ tooltip: classes.tooltip }} title={currentUser.email} arrow={false}>
        <IconButton
          aria-label="User profile menu button"
          color="inherit"
          id="user-profile-button"
          aria-controls={userMenuOpen ? "user-profile-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={userMenuOpen ? "true" : undefined}
          onClick={(event) => setUserAnchorEl(event.currentTarget)}
          data-testid="user-button"
          size="small"
          ref={ref}
          className={classes.iconButton}
        >
          <Avatar className={classes.avatar} variant="rounded">
            {currentUser.avatarImageUrl ? (
              <img
                src={currentUser.avatarImageUrl}
                referrerPolicy="same-origin"
                className={classes.userIconImage}
              />
            ) : (
              <PersonIcon />
            )}
          </Avatar>
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <Stack direction="row" alignItems="center">
      <AppBarIconButton
        id="preferences-button"
        title="Preferences"
        aria-controls={prefsDialogOpen ? "preferences-dialog" : undefined}
        aria-haspopup="true"
        aria-expanded={prefsDialogOpen ? "true" : undefined}
        onClick={() => {
          void analytics.logEvent(AppEvent.APP_BAR_CLICK_CTA, {
            cta: "preferences-dialog",
          });
          setPrefsDialogOpen(true);
        }}
        data-testid="user-button"
      >
        <Settings24Regular />
      </AppBarIconButton>
      {!disableSignIn && signIn != undefined && (
        <Button
          variant="contained"
          color="primary"
          className={classes.button}
          size="small"
          onClick={() => {
            signIn();
            void analytics.logEvent(AppEvent.APP_BAR_CLICK_CTA, {
              user: "unauthenticated",
              cta: "sign-in",
            });
          }}
        >
          Sign in
        </Button>
      )}
    </Stack>
  );
});
UserButton.displayName = "UserButton";
