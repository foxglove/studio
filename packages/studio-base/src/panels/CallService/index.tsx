// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Button, TextField, Tooltip, Typography, inputBaseClasses } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { makeStyles } from "tss-react/mui";

import Log from "@foxglove/log";
import { useDataSourceInfo } from "@foxglove/studio-base/PanelAPI";
import { useMessagePipeline } from "@foxglove/studio-base/components/MessagePipeline";
import Panel from "@foxglove/studio-base/components/Panel";
import PanelToolbar from "@foxglove/studio-base/components/PanelToolbar";
import Stack from "@foxglove/studio-base/components/Stack";
import { CallServiceConfig } from "@foxglove/studio-base/panels/CallService/types";
import { PlayerCapabilities } from "@foxglove/studio-base/players/types";
import { useDefaultPanelTitle } from "@foxglove/studio-base/providers/PanelStateContextProvider";
import { SaveConfig } from "@foxglove/studio-base/types/panels";
import { fonts } from "@foxglove/studio-base/util/sharedStyleConstants";

import { defaultConfig, useCallServicePanelSettings } from "./settings";

const log = Log.getLogger(__dirname);

type Props = {
  config: CallServiceConfig;
  saveConfig: SaveConfig<CallServiceConfig>;
};

type State = {
  status: "requesting" | "error" | "success";
  value: string;
};

const useStyles = makeStyles<{ buttonColor?: string }>()((theme, { buttonColor }) => {
  const augmentedButtonColor = buttonColor
    ? theme.palette.augmentColor({
        color: { main: buttonColor },
      })
    : undefined;

  return {
    button: {
      backgroundColor: augmentedButtonColor?.main,
      color: augmentedButtonColor?.contrastText,

      "&:hover": {
        backgroundColor: augmentedButtonColor?.dark,
      },
    },
    textarea: {
      height: "100%",

      [`.${inputBaseClasses.root}`]: {
        width: "100%",
        height: "100%",
        textAlign: "left",
        backgroundColor: theme.palette.background.paper,
        overflow: "hidden",
        padding: theme.spacing(1, 0.5),

        [`.${inputBaseClasses.input}`]: {
          height: "100% !important",
          lineHeight: 1.4,
          fontFamily: fonts.MONOSPACE,
          overflow: "auto !important",
          resize: "none",
        },
      },
    },
  };
});

function parseInput(value: string): { error?: string; parsedObject?: unknown } {
  let parsedObject;
  let error = undefined;
  try {
    const parsedAny: unknown = JSON.parse(value);
    if (Array.isArray(parsedAny)) {
      error = "Message content must be an object, not an array";
    } else if (parsedAny == null /* eslint-disable-line no-restricted-syntax */) {
      error = "Message content must be an object, not null";
    } else if (typeof parsedAny !== "object") {
      error = `Message content must be an object, not ‘${typeof parsedAny}’`;
    } else {
      parsedObject = parsedAny;
    }
  } catch (e) {
    error = value.length !== 0 ? e.message : "Enter valid message content as JSON";
  }
  return { error, parsedObject };
}

function CallService(props: Props) {
  const { saveConfig, config } = props;
  const { datatypes, capabilities } = useDataSourceInfo();
  const { classes } = useStyles({ buttonColor: config.buttonColor });
  useCallServicePanelSettings(config, saveConfig, datatypes);
  const callService = useMessagePipeline((context) => context.callService);
  const [state, setState] = useState<State | undefined>();

  const { error: requestParseError, parsedObject } = useMemo(
    () => parseInput(config.requestPayload ?? ""),
    [config.requestPayload],
  );

  const canCallService = Boolean(
    capabilities.includes(PlayerCapabilities.callServices) &&
      config.requestPayload &&
      config.serviceName &&
      parsedObject != undefined &&
      state?.status !== "requesting",
  );

  const [, setDefaultPanelTitle] = useDefaultPanelTitle();

  useEffect(() => {
    if (config.serviceName != undefined && config.serviceName.length > 0) {
      setDefaultPanelTitle(`Call Service ${config.serviceName}`);
    } else {
      setDefaultPanelTitle("Call Service");
    }
  }, [config.serviceName, setDefaultPanelTitle]);

  const statusMessage = useMemo(() => {
    if (!capabilities.includes(PlayerCapabilities.callServices)) {
      return "Connect to a data source that supports calling services";
    }
    if (!config.serviceName) {
      return "Configure a service in the panel settings";
    }
    return undefined;
  }, [capabilities, config.serviceName]);

  const callServiceClicked = useCallback(async () => {
    if (!canCallService) {
      return;
    }

    try {
      setState({ status: "requesting", value: `Calling ${config.serviceName}...` });
      const response = await callService(config.serviceName!, JSON.parse(config.requestPayload!));
      setState({ status: "success", value: JSON.stringify(response, undefined, 2) ?? "" });
    } catch (err) {
      setState({ status: "error", value: (err as Error).message });
      log.error(err);
    }
  }, [canCallService, callService, config.serviceName, config.requestPayload]);

  return (
    <Stack fullHeight>
      <PanelToolbar />
      <Stack
        flex="auto"
        gap={1}
        padding={1.5}
        position="relative"
        direction={config.layout === "horizontal" ? "row" : "column"}
      >
        <Stack flexGrow="1">
          <Typography variant="caption" noWrap>
            Request
          </Typography>
          <TextField
            variant="outlined"
            className={classes.textarea}
            multiline
            size="small"
            placeholder="Enter service request as JSON"
            value={config.requestPayload}
            onChange={(event) => saveConfig({ requestPayload: event.target.value })}
            error={requestParseError != undefined}
          />
          {requestParseError && (
            <Typography variant="caption" noWrap color={requestParseError ? "error" : undefined}>
              {requestParseError}
            </Typography>
          )}
        </Stack>
        <Stack flexGrow="1">
          <Typography variant="caption" noWrap>
            Response
          </Typography>
          <TextField
            variant="outlined"
            className={classes.textarea}
            multiline
            size="small"
            placeholder="Response"
            value={state?.value}
            error={state?.status === "error"}
          />
        </Stack>
      </Stack>
      <Stack
        direction="column-reverse"
        justifyContent="center"
        alignItems="center"
        overflow="hidden"
        paddingBottom={1.5}
      >
        <Tooltip title={config.buttonTooltip}>
          <span>
            <Button
              className={classes.button}
              variant="contained"
              disabled={!canCallService}
              onClick={callServiceClicked}
            >
              {config.buttonText}
            </Button>
          </span>
        </Tooltip>
        {statusMessage && (
          <Typography variant="caption" noWrap>
            {statusMessage}
          </Typography>
        )}
      </Stack>
    </Stack>
  );
}

export default Panel(
  Object.assign(React.memo(CallService), {
    panelType: "CallService",
    defaultConfig,
  }),
);
