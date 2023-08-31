// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { BookStar20Regular, Document20Regular, FolderOpen20Regular } from "@fluentui/react-icons";
import {
  Divider,
  ListSubheader,
  Menu,
  MenuItem,
  MenuProps,
  SvgIcon,
  Typography,
} from "@mui/material";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { makeStyles } from "tss-react/mui";

import TextMiddleTruncate from "@foxglove/studio-base/components/TextMiddleTruncate";
import { useAnalytics } from "@foxglove/studio-base/context/AnalyticsContext";
import { useAppContext } from "@foxglove/studio-base/context/AppContext";
import { useCurrentUserType } from "@foxglove/studio-base/context/CurrentUserContext";
import { usePlayerSelection } from "@foxglove/studio-base/context/PlayerSelectionContext";
import { AppEvent } from "@foxglove/studio-base/services/IAnalytics";

const useStyles = makeStyles<void>()((theme) => ({
  menuItem: {
    gap: theme.spacing(1),

    svg: { color: theme.palette.primary.main },
  },
  paper: {
    maxWidth: 300,
  },
}));

export type AppMenuProps = MenuProps;

export function AppMenu(props: MenuProps): JSX.Element {
  const { classes } = useStyles();
  const { appBarMenuItems } = useAppContext();
  const { recentSources, selectRecent } = usePlayerSelection();
  const { t } = useTranslation("openDialog");

  const analytics = useAnalytics();
  const user = useCurrentUserType();

  const handleAnalytics = useCallback(
    (cta: string) => void analytics.logEvent(AppEvent.APP_MENU_CLICK, { user, cta }),
    [analytics, user],
  );

  return (
    <Menu
      {...props}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "left",
      }}
      slotProps={{
        paper: {
          className: classes.paper,
        },
      }}
    >
      <ListSubheader disableSticky>
        <Typography variant="overline">{t("openDataSource")}</Typography>
      </ListSubheader>
      <MenuItem className={classes.menuItem}>
        <FolderOpen20Regular />
        {t("openLocalFile")}
      </MenuItem>
      <MenuItem className={classes.menuItem}>
        <SvgIcon fontSize="small" color="primary" viewBox="0 0 2048 2048">
          <path d="M1408 256h640v640h-640V640h-120l-449 896H640v256H0v-640h640v256h120l449-896h199V256zM512 1664v-384H128v384h384zm1408-896V384h-384v384h384z" />
        </SvgIcon>
        {t("openConnection")}
      </MenuItem>
      {appBarMenuItems && <Divider variant="middle" />}
      {(appBarMenuItems ?? []).map((item, idx) => {
        switch (item.type) {
          case "item":
            return (
              <MenuItem
                onClick={(event) => {
                  item.onClick?.(event);
                  props.onClose?.({}, "backdropClick");
                }}
                key={item.key}
                className={classes.menuItem}
              >
                {item.label}
              </MenuItem>
            );
          case "divider":
            return <Divider variant="middle" key={`divider${idx}`} />;
          case "subheader":
            return (
              <ListSubheader key={item.key} disableSticky>
                <Typography variant="overline">{item.label}</Typography>
              </ListSubheader>
            );
        }
      })}
      <Divider variant="middle" />
      {recentSources.length > 0 && (
        <>
          <ListSubheader disableSticky>
            <Typography variant="overline">{t("recentDataSources")}</Typography>
          </ListSubheader>
          {recentSources.slice(0, 5).map((source) => (
            <MenuItem
              className={classes.menuItem}
              onClick={() => {
                handleAnalytics("open-recent");
                selectRecent(source.id);
              }}
              key={source.id}
            >
              <Document20Regular style={{ flex: "none" }} />
              <TextMiddleTruncate text={source.title} />
            </MenuItem>
          ))}
        </>
      )}
      <Divider variant="middle" />
      <MenuItem className={classes.menuItem}>
        <BookStar20Regular />
        {t("exploreSampleData")}
      </MenuItem>
    </Menu>
  );
}
