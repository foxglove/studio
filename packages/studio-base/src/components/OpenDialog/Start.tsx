// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Button, Link, SvgIcon, Typography } from "@mui/material";
import { useMemo } from "react";
import { makeStyles } from "tss-react/mui";

// import { AppSetting } from "@foxglove/studio-base/AppSetting";
import Stack from "@foxglove/studio-base/components/Stack";
import TextMiddleTruncate from "@foxglove/studio-base/components/TextMiddleTruncate";
import { useAnalytics } from "@foxglove/studio-base/context/AnalyticsContext";
import { usePlayerSelection } from "@foxglove/studio-base/context/PlayerSelectionContext";
// import { useAppConfigurationValue } from "@foxglove/studio-base/hooks";
import { AppEvent } from "@foxglove/studio-base/services/IAnalytics";

import { OpenDialogViews } from "./types";

export type IStartProps = {
  supportedLocalFileExtensions?: string[];
  onSelectView: (newValue: OpenDialogViews) => void;
};

const useStyles = makeStyles()((theme) => ({
  grid: {
    // See comment below for explanation of grid properties
    display: "grid",
    gridTemplateRows: "auto",
    gridTemplateColumns: `minmax(${(7 / 12) * 100}%, auto) 1fr`,

    [theme.breakpoints.down("md")]: {
      display: "flex",
      flexDirection: "column",
    },
  },
  sidebar: {
    backgroundColor: theme.palette.background.default,
    padding: theme.spacing(12, 6, 6),
  },
  connectionButton: {
    textAlign: "left",
    justifyContent: "flex-start",
    padding: theme.spacing(2, 3),
    gap: theme.spacing(1.5),
    borderColor: theme.palette.divider,

    ".MuiButton-startIcon .MuiSvgIcon-fontSizeLarge": {
      fontSize: 28,
    },
  },
  recentButton: {
    textAlign: "left",
    justifyContent: "flex-start",
    padding: theme.spacing(1.5, 2.5),
    gap: theme.spacing(1.5),
    borderColor: theme.palette.divider,

    ".MuiButton-startIcon .MuiSvgIcon-fontSizeLarge": {
      fontSize: 28,
    },
  },
}));

type DataSourceOptionProps = {
  text: string;
  secondaryText: string;
  icon: JSX.Element;
  onClick: () => void;
  href?: string;
};

function DataSourceOption(props: DataSourceOptionProps): JSX.Element {
  const { icon, onClick, text, secondaryText, href } = props;
  const { classes } = useStyles();
  const button = (
    <Button
      className={classes.connectionButton}
      fullWidth
      color="inherit"
      variant="outlined"
      size="large"
      startIcon={icon}
      onClick={onClick}
    >
      <Stack flex="auto" zeroMinWidth>
        <Typography component="div" variant="subtitle1" color="text.primary">
          {text}
        </Typography>
        <Typography component="div" variant="body2" color="text.secondary" noWrap>
          {secondaryText}
        </Typography>
      </Stack>
    </Button>
  );

  return href ? (
    <Link href={href} target="_blank" style={{ textDecoration: "none" }}>
      {button}
    </Link>
  ) : (
    button
  );
}

export default function Start(props: IStartProps): JSX.Element {
  const { supportedLocalFileExtensions = [], onSelectView } = props;
  const { recentSources, selectRecent } = usePlayerSelection();
  const { classes } = useStyles();
  const analytics = useAnalytics();

  // const [showOnStartup = true, setShowOnStartup] = useAppConfigurationValue<boolean>(
  //   AppSetting.SHOW_OPEN_DIALOG_ON_STARTUP,
  // );

  const startItems = useMemo(() => {
    const formatter = new Intl.ListFormat("en-US", { style: "long" });
    const supportedLocalFiles = formatter.format(
      Array.from(new Set(supportedLocalFileExtensions)).sort(),
    );
    return [
      {
        key: "open-local-file",
        text: "Open local file",
        secondaryText: `Supports ${supportedLocalFiles} files.`,
        icon: (
          <SvgIcon fontSize="large" color="primary" viewBox="0 0 2048 2048">
            <path d="M1955 1533l-163-162v677h-128v-677l-163 162-90-90 317-317 317 317-90 90zM256 1920h1280v128H128V0h1115l549 549v475h-128V640h-512V128H256v1792zM1280 512h293l-293-293v293z" />
          </SvgIcon>
        ),
        onClick: () => {
          onSelectView("file");
          void analytics.logEvent(AppEvent.DIALOG_SELECT_VIEW, { type: "local" });
        },
      },
      {
        key: "open-url",
        text: "Open remote data",
        secondaryText: "Load your team's data from Foxglove Data Platform.",
        icon: (
          <SvgIcon fontSize="large" color="primary" viewBox="0 0 2048 2048">
            <path d="M256 1920h512v128H128V0h1115l549 549v91h-640V128H256v1792zM1280 512h293l-293-293v293zm128 256q133 0 249 50t204 137 137 203 50 250q0 133-50 249t-137 204-203 137-250 50q-133 0-249-50t-204-137-137-203-50-250q0-133 50-249t137-204 203-137 250-50zm0 1152q21 0 37-14t28-38 21-53 15-57 9-53 6-41h-230q2 14 5 39t10 53 16 58 21 52 27 39 35 15zm126-384q1-32 1-64t1-64q0-63-3-128h-250q-3 65-3 128 0 64 3 128h251zm-638-128q0 32 4 64t12 64h243q-3-64-3-128 0-63 3-128H912q-8 32-12 64t-4 64zm512-512q-19 0-34 15t-27 39-21 53-15 57-10 53-6 39h225q-2-13-6-37t-11-53-16-58-20-54-27-39-32-15zm253 384q3 65 3 128v64q0 32-2 64h242q8-32 12-64t4-64q0-32-4-64t-12-64h-243zm190-128q-43-75-108-131t-145-88q21 52 32 107t19 112h202zm-637-218q-78 32-142 88t-107 130h200q13-111 49-218zm-249 730q42 73 106 129t142 88q-21-51-31-106t-17-111H965zm642 215q77-32 139-87t105-128h-198q-5 51-15 109t-31 106z" />
          </SvgIcon>
        ),
        iconProps: { iconName: "FileASPX" },
        href: "https://console.foxglove.dev/recordings",
        onClick: () => {
          void analytics.logEvent(AppEvent.DIALOG_SELECT_VIEW, { type: "data-platform" });
        },
      },
      {
        key: "open-connection",
        text: "Open connection",
        secondaryText: "Connect to a live robot or server.",
        icon: (
          <SvgIcon fontSize="large" color="primary" viewBox="0 0 2048 2048">
            <path d="M1408 256h640v640h-640V640h-120l-449 896H640v256H0v-640h640v256h120l449-896h199V256zM512 1664v-384H128v384h384zm1408-896V384h-384v384h384z" />
          </SvgIcon>
        ),
        onClick: () => {
          onSelectView("connection");
          void analytics.logEvent(AppEvent.DIALOG_SELECT_VIEW, { type: "live" });
        },
      },
    ];
  }, [analytics, onSelectView, supportedLocalFileExtensions]);

  return (
    <div className={classes.grid}>
      <Stack padding={6}>
        <Typography variant="h3" fontWeight={600} gutterBottom>
          Welcome to Foxglove Studio
        </Typography>
        <Stack gap={4} paddingTop={1}>
          <Stack gap={1}>
            <Typography variant="h5" color="text.secondary" gutterBottom>
              Open data source
            </Typography>
            {startItems.map((item) => (
              <DataSourceOption
                key={item.key}
                text={item.text}
                secondaryText={item.secondaryText}
                icon={item.icon}
                onClick={item.onClick}
                href={item.href}
              />
            ))}
          </Stack>
          <Stack gap={1}>
            <Typography variant="h5" color="text.secondary" gutterBottom>
              Recent data sources
            </Typography>
            {recentSources.map((recent) => (
              <Button
                onClick={() => selectRecent(recent.id)}
                className={classes.recentButton}
                size="small"
                variant="outlined"
                color="inherit"
                key={recent.id}
                id={recent.id}
              >
                <Stack direction="row" overflow="hidden" gap={1}>
                  {recent.label && (
                    <>
                      <Typography component="div" variant="body2" color="text.secondary" noWrap>
                        {recent.label}
                      </Typography>
                      {" — "}
                    </>
                  )}
                  <Typography
                    variant="body2"
                    color="inherit"
                    component="div"
                    noWrap
                    overflow="hidden"
                  >
                    <TextMiddleTruncate text={recent.title} />
                  </Typography>
                </Stack>
              </Button>
            ))}
          </Stack>
          {/* <FormControlLabel
            label="Show on startup"
            control={
              <Checkbox
                color="primary"
                checked={showOnStartup}
                onChange={async (_, checked) => {
                  await setShowOnStartup(checked);
                }}
              />
            }
          /> */}
        </Stack>
      </Stack>
      <Stack gap={4} className={classes.sidebar}>
        <Stack gap={1}>
          <Typography variant="h5" color="text.secondary" gutterBottom>
            New to Studio?
          </Typography>
          <Typography variant="body2">
            Start exploring with an example layout and a sample self-driving dataset
          </Typography>
          <Stack direction="row" gap={1}>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => {
                onSelectView("demo");
                void analytics.logEvent(AppEvent.DIALOG_SELECT_VIEW, { type: "demo" });
              }}
            >
              Explore sample data
            </Button>
            <Button href="https://foxglove.dev/docs/studio" color="primary" target="_blank">
              View docs
            </Button>
          </Stack>
        </Stack>
        <Stack gap={1}>
          <Typography variant="h5" color="text.secondary" gutterBottom>
            Store, explore, and stream your data
          </Typography>
          <Typography variant="body2">
            Manage your robotics data with Foxglove Data Platform. Securely store petabytes of
            indexed and tagged data for easy discovery and analysis.
          </Typography>
          <Stack direction="row" gap={1}>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => {
                onSelectView("demo");
                void analytics.logEvent(AppEvent.DIALOG_SELECT_VIEW, { type: "demo" });
              }}
            >
              Create a free account
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </div>
  );
}
