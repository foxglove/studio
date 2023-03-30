// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Divider, Menu, MenuItem, PopoverPosition, PopoverReference } from "@mui/material";
import { useSnackbar } from "notistack";
import { useCallback } from "react";
import { makeStyles } from "tss-react/mui";

import Logger from "@foxglove/log";
import { useAnalytics } from "@foxglove/studio-base/context/AnalyticsContext";
import {
  useCurrentUser,
  useCurrentUserType,
} from "@foxglove/studio-base/context/CurrentUserContext";
import { useWorkspaceActions } from "@foxglove/studio-base/context/WorkspaceContext";
import { useConfirm } from "@foxglove/studio-base/hooks/useConfirm";
import { AppEvent } from "@foxglove/studio-base/services/IAnalytics";

const log = Logger.getLogger(__filename);

const useStyles = makeStyles()({
  menuList: {
    minWidth: 200,
  },
});

type UserMenuProps = {
  handleClose: () => void;
  anchorEl?: HTMLElement;
  anchorReference?: PopoverReference;
  anchorPosition?: PopoverPosition;
  disablePortal?: boolean;
  open: boolean;
};

export function UserMenu({
  anchorEl,
  anchorReference,
  anchorPosition,
  disablePortal,
  handleClose,
  open,
}: UserMenuProps): JSX.Element {
  const { classes } = useStyles();
  const { currentUser, signOut } = useCurrentUser();
  const currentUserType = useCurrentUserType();
  const analytics = useAnalytics();
  const { enqueueSnackbar } = useSnackbar();
  const [confirm, confirmModal] = useConfirm();

  const { setPrefsDialogOpen } = useWorkspaceActions();

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

  const onPreferencesClick = useCallback(() => {
    void analytics.logEvent(AppEvent.APP_BAR_CLICK_CTA, {
      user: currentUserType,
      cta: "preferences-dialog",
    });
    setPrefsDialogOpen(true);
  }, [analytics, currentUserType, setPrefsDialogOpen]);

  const onProfileClick = useCallback(() => {
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
        MenuListProps={{ className: classes.menuList, dense: true }}
      >
        <MenuItem disabled>{`Signed in as ${currentUser.email}`}</MenuItem>
        <MenuItem onClick={onPreferencesClick}>Preferences</MenuItem>
        <MenuItem onClick={onProfileClick}>Profile</MenuItem>
        <Divider variant="middle" />
        <MenuItem onClick={onSignoutClick}>Sign out</MenuItem>
      </Menu>
      {confirmModal}
    </>
  );
}
