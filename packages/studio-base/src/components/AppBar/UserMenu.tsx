// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  Divider,
  ListItemText,
  Menu,
  MenuItem,
  PopoverPosition,
  PopoverReference,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { SetStateAction, useCallback } from "react";
import { makeStyles } from "tss-react/mui";

import Logger from "@foxglove/log";
import { useCurrentUser, User, UserType } from "@foxglove/studio-base/context/CurrentUserContext";
import { useConfirm } from "@foxglove/studio-base/hooks/useConfirm";

const log = Logger.getLogger(__filename);

const useStyles = makeStyles()({
  menuList: {
    minWidth: 200,
  },
});

export type UserButtonProps = {
  disableSignIn?: boolean;
  currentUser?: User;
  currentUserType?: UserType;
  signIn?: () => void;
  userMenuOpen: boolean;
  setUserAnchorEl: (value: SetStateAction<HTMLElement | undefined>) => void;
  prefsDialogOpen: boolean;
  // eslint-disable-next-line @foxglove/no-boolean-parameters
  setPrefsDialogOpen: (open: boolean) => void;
};

export function UserMenu({
  anchorEl,
  anchorReference,
  anchorPosition,
  disablePortal,
  handleClose,
  open,
  onPreferencesClick,
}: {
  handleClose: () => void;
  anchorEl?: HTMLElement;
  anchorReference?: PopoverReference;
  anchorPosition?: PopoverPosition;
  disablePortal?: boolean;
  open: boolean;
  onPreferencesClick: () => void;
}): JSX.Element {
  const { classes } = useStyles();
  const { currentUser, signOut } = useCurrentUser();
  const { enqueueSnackbar } = useSnackbar();
  const [confirm, confirmModal] = useConfirm();

  const beginSignOut = useCallback(async () => {
    try {
      await signOut?.();
    } catch (error) {
      log.error(error);
      enqueueSnackbar((error as Error).toString(), { variant: "error" });
    }
  }, [enqueueSnackbar, signOut]);

  const onSignoutClick = useCallback(() => {
    void confirm({
      title: "Are you sure you want to sign out?",
      ok: "Sign out",
    }).then((response) => {
      if (response === "ok") {
        void beginSignOut();
      }
    });
  }, [beginSignOut, confirm]);

  const onSettingsClick = useCallback(() => {
    window.open(process.env.FOXGLOVE_ACCOUNT_DASHBOARD_URL, "_blank");
  }, []);

  if (currentUser == undefined) {
    return <></>;
  }

  return (
    <>
      <Menu
        anchorEl={anchorEl}
        anchorReference={anchorReference}
        anchorPosition={anchorPosition}
        disablePortal={disablePortal}
        id="account-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        MenuListProps={{ className: classes.menuList }}
      >
        <MenuItem onClick={onPreferencesClick}>
          <ListItemText primary="Preferences" />
        </MenuItem>
        <MenuItem onClick={onSettingsClick}>
          <ListItemText primary={currentUser.email} />
        </MenuItem>
        <Divider variant="middle" />
        <MenuItem onClick={onSignoutClick}>
          <ListItemText>
            <Typography color="error">Sign out</Typography>
          </ListItemText>
        </MenuItem>
      </Menu>
      {confirmModal}
    </>
  );
}
