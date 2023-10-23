// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  Divider,
  Menu,
  MenuItem,
  PaperProps,
  PopoverPosition,
  PopoverReference,
} from "@mui/material";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { makeStyles } from "tss-react/mui";

import { AppSettingsTab } from "@foxglove/studio-base/components/AppSettingsDialog/AppSettingsDialog";
import { useAnalytics } from "@foxglove/studio-base/context/AnalyticsContext";
import { useWorkspaceActions } from "@foxglove/studio-base/context/Workspace/useWorkspaceActions";
import { AppEvent } from "@foxglove/studio-base/services/IAnalytics";

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
  const analytics = useAnalytics();
  const { t } = useTranslation("appBar");

  const { dialogActions } = useWorkspaceActions();

  const onSettingsClick = useCallback(
    (tab?: AppSettingsTab) => {
      void analytics.logEvent(AppEvent.APP_BAR_CLICK_CTA, {
        user: "unauthenticated",
        cta: "app-settings-dialog",
      });
      dialogActions.preferences.open(tab);
    },
    [analytics, dialogActions.preferences],
  );

  const onDocsClick = useCallback(() => {
    void analytics.logEvent(AppEvent.APP_BAR_CLICK_CTA, {
      user: "unauthenticated",
      cta: "docs",
    });
    window.open("https://foxglove.dev/docs", "_blank");
  }, [analytics]);

  const onSlackClick = useCallback(() => {
    void analytics.logEvent(AppEvent.APP_BAR_CLICK_CTA, {
      user: "unauthenticated",
      cta: "join-slack",
    });
    window.open("https://foxglove.dev/slack", "_blank");
  }, [analytics]);

  return (
    <>
      <Menu
        anchorEl={anchorEl}
        anchorReference={anchorReference}
        anchorPosition={anchorPosition}
        disablePortal={disablePortal}
        id="user-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        MenuListProps={{ className: classes.menuList, dense: true }}
        PaperProps={
          {
            "data-tourid": "user-menu",
          } as Partial<PaperProps & { "data-tourid"?: string }>
        }
      >
        <MenuItem
          onClick={() => {
            onSettingsClick();
          }}
        >
          {t("settings")}
        </MenuItem>
        <MenuItem
          onClick={() => {
            onSettingsClick("extensions");
          }}
        >
          {t("extensions")}
        </MenuItem>
        <Divider variant="middle" />
        <MenuItem onClick={onDocsClick}>{t("documentation")}</MenuItem>
        <MenuItem onClick={onSlackClick}>{t("joinSlackCommunity")}</MenuItem>
      </Menu>
    </>
  );
}
