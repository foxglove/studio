// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
//
// This file incorporates work covered by the following copyright and
// permission notice:
//
//   Copyright 2019-2021 Cruise LLC
//
//   This source code is licensed under the Apache License, Version 2.0,
//   found at http://www.apache.org/licenses/LICENSE-2.0
//   You may not use this file except in compliance with the License.

import { Button, Typography, inputBaseClasses, TextField, FormHelperText } from "@mui/material";
import { produce } from "immer";
import { set } from "lodash";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { makeStyles } from "tss-react/mui";
import { useDebounce } from "use-debounce";

import { useRethrow } from "@foxglove/hooks";
import { SettingsTreeAction, SettingsTreeNodes } from "@foxglove/studio";
import { useDataSourceInfo } from "@foxglove/studio-base/PanelAPI";
import Panel from "@foxglove/studio-base/components/Panel";
import PanelToolbar from "@foxglove/studio-base/components/PanelToolbar";
import Stack from "@foxglove/studio-base/components/Stack";
import usePublisher from "@foxglove/studio-base/hooks/usePublisher";
import { PlayerCapabilities } from "@foxglove/studio-base/players/types";
import { usePanelSettingsTreeUpdate } from "@foxglove/studio-base/providers/PanelStateContextProvider";
import { SaveConfig } from "@foxglove/studio-base/types/panels";
import { fonts } from "@foxglove/studio-base/util/sharedStyleConstants";

import buildSampleMessage from "./buildSampleMessage";

export type Config = Partial<{
  topicName: string;
  schemaName: string;
  buttonText: string;
  buttonTooltip: string;
  buttonColor: string;
  advancedView: boolean;
  value: string;
}>;

type Props = {
  config: Config;
  saveConfig: SaveConfig<Config>;
};

function buildSettingsTree(config: Config, schemaNames: string[]): SettingsTreeNodes {
  return {
    general: {
      fields: {
        topicName: { label: "Topic", input: "messagepath", value: config.topicName },
        schemaName: {
          label: "Message schema",
          input: "autocomplete",
          placeholder: "Choose a message schema",
          items: schemaNames,
          value: config.schemaName,
        },
        advancedView: { label: "Editing mode", input: "boolean", value: config.advancedView },
      },
    },
    styles: {
      label: "Styling",
      fields: {
        buttonText: { label: "Button title", input: "string", value: config.buttonText },
        buttonTooltip: { label: "Button tooltip", input: "string", value: config.buttonTooltip },
        buttonColor: { label: "Button color", input: "rgb", value: config.buttonColor },
      },
    },
  };
}

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
    error = value.length !== 0 ? e.message : "";
  }
  return { error, parsedObject };
}

function Publish(props: Props) {
  const { datatypes, capabilities } = useDataSourceInfo();
  const {
    config: {
      topicName = "",
      schemaName = "",
      buttonText = "Publish",
      buttonTooltip = "",
      buttonColor = "#00A871",
      advancedView = true,
      value = "",
    },
    saveConfig,
  } = props;
  const { classes } = useStyles({ buttonColor });
  const [debouncedTopicName] = useDebounce(topicName, 500);

  const publish = usePublisher({
    name: "Publish",
    topic: debouncedTopicName,
    schemaName,
    datatypes,
  });

  const schemaNames = useMemo(() => Array.from(datatypes.keys()).sort(), [datatypes]);
  const { error, parsedObject } = useMemo(() => parseInput(value), [value]);
  const updatePanelSettingsTree = usePanelSettingsTreeUpdate();

  // when the selected datatype changes, replace the textarea contents with a sample message of the correct shape
  // Make sure not to build a sample message on first load, though -- we don't want to overwrite
  // the user's message just because prevDatatype hasn't been initialized.
  const prevDatatype = useRef<string | undefined>();
  useEffect(() => {
    if (
      schemaName.length > 0 &&
      prevDatatype.current != undefined &&
      schemaName !== prevDatatype.current &&
      datatypes.get(schemaName) != undefined
    ) {
      const sampleMessage = buildSampleMessage(datatypes, schemaName);
      if (sampleMessage != undefined) {
        const stringifiedSampleMessage = JSON.stringify(sampleMessage, undefined, 2);
        saveConfig({ value: stringifiedSampleMessage });
      }
    }
    prevDatatype.current = schemaName;
  }, [saveConfig, schemaName, datatypes]);

  const actionHandler = useCallback(
    (action: SettingsTreeAction) => {
      if (action.action !== "update") {
        return;
      }

      saveConfig(
        produce((draft) => {
          set(draft, action.payload.path.slice(1), action.payload.value);
        }),
      );
    },
    [saveConfig],
  );

  useEffect(() => {
    updatePanelSettingsTree({
      actionHandler,
      nodes: buildSettingsTree(props.config, schemaNames),
    });
  }, [actionHandler, props.config, schemaNames, updatePanelSettingsTree]);

  const onPublishClicked = useRethrow(
    useCallback(() => {
      if (topicName.length !== 0 && parsedObject != undefined) {
        publish(parsedObject as Record<string, unknown>);
      } else {
        throw new Error(`called _publish() when input was invalid`);
      }
    }, [publish, parsedObject, topicName]),
  );

  const canPublish = capabilities.includes(PlayerCapabilities.advertise);

  return (
    <Stack fullHeight>
      <PanelToolbar />
      <Stack flex="auto" gap={1} padding={1.5} position="relative">
        {advancedView && (
          <>
            <Typography variant="subtitle2">
              {topicName === "" || schemaName === ""
                ? "Configure a topic and message schema in the panel settings"
                : `Publishing to ${topicName} (${schemaName})`}
            </Typography>
            <Stack flexGrow="1">
              <TextField
                variant="outlined"
                className={classes.textarea}
                multiline
                size="small"
                placeholder="Enter message content as JSON"
                value={value}
                onChange={(event) => saveConfig({ value: event.target.value })}
                error={error?.length !== 0}
              />
            </Stack>
          </>
        )}
        <Stack
          direction="row"
          flexGrow={0}
          gap={1}
          justifyContent={advancedView ? "flex-end" : "center"}
          alignItems="center"
        >
          {error && (
            <FormHelperText
              error={!!error}
              style={{
                flex: "auto",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {error}
            </FormHelperText>
          )}
          <Button
            className={classes.button}
            variant="contained"
            title={canPublish ? buttonTooltip : "Connect to ROS to publish data"}
            disabled={!canPublish || parsedObject == undefined}
            onClick={onPublishClicked}
          >
            {buttonText}
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
}

export default Panel(
  Object.assign(React.memo(Publish), {
    panelType: "Publish",
    defaultConfig: {
      schemaName: "",
      topicName: "",
      buttonText: "Publish",
      buttonTooltip: "",
      buttonColor: "#00A871",
      advancedView: true,
      value: "",
    },
  }),
);
