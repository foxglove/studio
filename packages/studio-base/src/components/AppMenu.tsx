// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { ArrowUpRight16Regular } from "@fluentui/react-icons";
import {
  Button,
  ButtonGroup,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListSubheader,
  Popover,
  PopoverProps,
  SvgIcon,
  Typography,
  buttonClasses,
  buttonGroupClasses,
  dividerClasses,
} from "@mui/material";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { makeStyles } from "tss-react/mui";

import Stack from "@foxglove/studio-base/components/Stack";
import TextMiddleTruncate from "@foxglove/studio-base/components/TextMiddleTruncate";
import { useAnalytics } from "@foxglove/studio-base/context/AnalyticsContext";
import { useAppContext } from "@foxglove/studio-base/context/AppContext";
import { useCurrentUserType } from "@foxglove/studio-base/context/CurrentUserContext";
import { usePlayerSelection } from "@foxglove/studio-base/context/PlayerSelectionContext";
import { AppEvent } from "@foxglove/studio-base/services/IAnalytics";

const useStyles = makeStyles<void, "externalIcon">()((theme, _params, classes) => ({
  buttonGroup: {
    [`.${buttonGroupClasses.grouped}`]: {
      textAlign: "left",
      justifyContent: "flex-start",
      gap: theme.spacing(1.5),
      borderColor: theme.palette.divider,

      [`.${buttonClasses.startIcon}`]: {
        fontSize: 24,
        marginRight: 0,

        "> *:nth-of-type(1)": {
          fontSize: "inherit",
        },
      },
    },
  },
  listItemButton: {
    justifyContent: "space-between",

    [`&:not(:hover) .${classes.externalIcon}`]: {
      visibility: "hidden",
    },
  },
  externalIcon: {
    color: theme.palette.primary.main,
  },
  paper: {
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
      <Stack padding={2} paddingBottom={0}>
        <ButtonGroup className={classes.buttonGroup} orientation="vertical">
          <Button
            fullWidth
            startIcon={
              <SvgIcon fontSize="inherit" color="primary" viewBox="0 0 2048 2048">
                <path d="M1955 1533l-163-162v677h-128v-677l-163 162-90-90 317-317 317 317-90 90zM256 1920h1280v128H128V0h1115l549 549v475h-128V640h-512V128H256v1792zM1280 512h293l-293-293v293z" />
              </SvgIcon>
            }
          >
            <Stack flex="auto" zeroMinWidth>
              <Typography variant="subtitle2" color="text.primary">
                {t("openLocalFile")}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {t("openLocalFileDescription")}
              </Typography>
            </Stack>
          </Button>
          <Button
            fullWidth
            startIcon={
              <SvgIcon fontSize="inherit" color="primary" viewBox="0 0 2048 2048">
                <path d="M1408 256h640v640h-640V640h-120l-449 896H640v256H0v-640h640v256h120l449-896h199V256zM512 1664v-384H128v384h384zm1408-896V384h-384v384h384z" />
              </SvgIcon>
            }
          >
            <Stack flex="auto" zeroMinWidth>
              <Typography variant="subtitle2" color="text.primary">
                {t("openConnection")}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {t("openConnectionDescription")}
              </Typography>
            </Stack>
          </Button>
        </ButtonGroup>
      </Stack>
      <List>
        {recentSources.length > 0 && (
          <>
            <ListSubheader disableSticky>
              <Typography variant="overline">{t("recentDataSources")}</Typography>
            </ListSubheader>
            {recentSources.slice(0, 5).map((source) => (
              <ListItem disablePadding key={source.id}>
                <ListItemButton
                  className={classes.listItemButton}
                  onClick={() => {
                    handleAnalytics("open-recent");
                    selectRecent(source.id);
                  }}
                >
                  <TextMiddleTruncate text={source.title} />
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
      </List>
    </Popover>
  );
}
