// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  ArrowUpRight16Regular,
  BookStar20Regular,
  Document20Regular,
  FolderOpen20Regular,
} from "@fluentui/react-icons";
import {
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListSubheader,
  Popover,
  PopoverProps,
  SvgIcon,
  Typography,
  dividerClasses,
  listItemSecondaryActionClasses,
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

const useStyles = makeStyles<void, "externalIcon">()((theme, _params, classes) => ({
  listItem: {
    [`&:not(:hover) .${listItemSecondaryActionClasses.root}`]: {
      visibility: "hidden",
    },
  },
  listItemButton: {
    justifyContent: "space-between",
    gap: theme.spacing(1),

    svg: {
      color: theme.palette.primary.main,
    },
    [`&:not(:hover) .${classes.externalIcon}`]: {
      visibility: "hidden",
    },
  },
  externalIcon: {
    color: theme.palette.primary.main,
  },
  paper: {
    // paddingInline: theme.spacing(1),
    maxWidth: 320,
    backgroundColor: theme.palette.background.menu,

    [`.${dividerClasses.root}`]: {
      marginBlock: theme.spacing(1),
    },
  },
}));

export type AppMenuProps = PopoverProps;

export function AppMenu(props: PopoverProps): JSX.Element {
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
    <Popover
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
      <List dense>
        <ListSubheader disableSticky>
          <Typography variant="overline">{t("openDataSource")}</Typography>
        </ListSubheader>
        <ListItem disablePadding>
          <ListItemButton className={classes.listItemButton}>
            <FolderOpen20Regular />
            <ListItemText
              primary={t("openLocalFile")}
              // secondary={t("openLocalFileDescription")}
              primaryTypographyProps={{
                variant: "subtitle2",
                color: "text.primary",
              }}
              secondaryTypographyProps={{
                variant: "caption",
                color: "text.secondary",
                noWrap: true,
              }}
            />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton className={classes.listItemButton}>
            <SvgIcon fontSize="small" color="primary" viewBox="0 0 2048 2048">
              <path d="M1408 256h640v640h-640V640h-120l-449 896H640v256H0v-640h640v256h120l449-896h199V256zM512 1664v-384H128v384h384zm1408-896V384h-384v384h384z" />
            </SvgIcon>
            <ListItemText
              primary={t("openConnection")}
              // secondary={t("openConnectionDescription")}
              primaryTypographyProps={{
                variant: "subtitle2",
                color: "text.primary",
              }}
              secondaryTypographyProps={{
                variant: "caption",
                color: "text.secondary",
                noWrap: true,
              }}
            />
          </ListItemButton>
        </ListItem>
        <Divider variant="middle" />
        {recentSources.length > 0 && (
          <>
            <ListSubheader disableSticky>
              <Typography variant="overline">{t("recentDataSources")}</Typography>
            </ListSubheader>
            {recentSources.slice(0, 5).map((source) => (
              <ListItem className={classes.listItem} disablePadding key={source.id}>
                <ListItemButton
                  className={classes.listItemButton}
                  onClick={() => {
                    handleAnalytics("open-recent");
                    selectRecent(source.id);
                  }}
                >
                  <Document20Regular style={{ flex: "none" }} />
                  <ListItemText
                    primary={<TextMiddleTruncate text={source.title} />}
                    primaryTypographyProps={{ variant: "body2" }}
                    // secondary="by Adrian Macneil 2 hours ago"
                    secondaryTypographyProps={{ variant: "caption", color: "text.secondary" }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </>
        )}
        {appBarMenuItems && <Divider variant="middle" />}
        {(appBarMenuItems ?? []).map((item, idx) => {
          switch (item.type) {
            case "item":
              return (
                <ListItem disablePadding key={item.key}>
                  <ListItemButton
                    className={classes.listItemButton}
                    onClick={(event) => {
                      item.onClick?.(event);
                      props.onClose?.({}, "backdropClick");
                    }}
                  >
                    {item.label}
                    {item.external === true && (
                      <ArrowUpRight16Regular className={classes.externalIcon} />
                    )}
                  </ListItemButton>
                </ListItem>
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
        <ListItem disablePadding>
          <ListItemButton className={classes.listItemButton}>
            <BookStar20Regular />
            <ListItemText
              primary={t("exploreSampleData")}
              primaryTypographyProps={{ variant: "body2" }}
            />
          </ListItemButton>
        </ListItem>
      </List>
    </Popover>
  );
}
