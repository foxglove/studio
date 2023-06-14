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

import { Button, inputBaseClasses, TextField, Typography } from "@mui/material";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { makeStyles } from "tss-react/mui";
import { useDebounce } from "use-debounce";

import { useRethrow } from "@foxglove/hooks";
import { useDataSourceInfo } from "@foxglove/studio-base/PanelAPI";
import EmptyState from "@foxglove/studio-base/components/EmptyState";
import Panel from "@foxglove/studio-base/components/Panel";
import PanelToolbar from "@foxglove/studio-base/components/PanelToolbar";
import Stack from "@foxglove/studio-base/components/Stack";
import usePublisher from "@foxglove/studio-base/hooks/usePublisher";
import { PlayerCapabilities } from "@foxglove/studio-base/players/types";
import { SaveConfig } from "@foxglove/studio-base/types/panels";
import { fonts } from "@foxglove/studio-base/util/sharedStyleConstants";

import buildSampleMessage from "./buildSampleMessage";
import { usePublishPanelSettings } from "./settings";
import { PublishConfig } from "./types";

type Props = {
  config: PublishConfig;
  saveConfig: SaveConfig<PublishConfig>;
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
    error = value.length !== 0 ? e.message : "";
  }
  return { error, parsedObject };
}

function Publish(props: Props) {
  const { saveConfig, config } = props;
  const { topics, datatypes, capabilities } = useDataSourceInfo();
  const { classes } = useStyles({ buttonColor: config.buttonColor });
  const [debouncedTopicName] = useDebounce(config.topicName ?? "", 500);

  const publish = usePublisher({
    name: "Publish",
    topic: debouncedTopicName,
    schemaName: config.datatype ?? "",
    datatypes,
  });

  const schemaNames = useMemo(() => Array.from(datatypes.keys()).sort(), [datatypes]);
  const { error, parsedObject } = useMemo(() => parseInput(config.value ?? ""), [config.value]);

  // when the selected datatype changes, replace the textarea contents with a sample message of the correct shape
  // Make sure not to build a sample message on first load, though -- we don't want to overwrite
  // the user's message just because prevDatatype hasn't been initialized.
  const prevDatatype = useRef<string | undefined>();
  useEffect(() => {
    if (
      config.datatype != undefined &&
      prevDatatype.current != undefined &&
      config.datatype !== prevDatatype.current &&
      datatypes.get(config.datatype) != undefined
    ) {
      const sampleMessage = buildSampleMessage(datatypes, config.datatype);
      if (sampleMessage != undefined) {
        const stringifiedSampleMessage = JSON.stringify(sampleMessage, undefined, 2);
        saveConfig({ value: stringifiedSampleMessage });
      }
    }
    prevDatatype.current = config.datatype;
  }, [saveConfig, config.datatype, datatypes]);

  usePublishPanelSettings(config, saveConfig, schemaNames, topics, datatypes);

  const onPublishClicked = useRethrow(
    useCallback(() => {
      if (config.topicName != undefined && parsedObject != undefined) {
        publish(parsedObject as Record<string, unknown>);
      } else {
        throw new Error(`called _publish() when input was invalid`);
      }
    }, [publish, parsedObject, config.topicName]),
  );

  const canPublish = capabilities.includes(PlayerCapabilities.advertise) && config.value !== "";

  if (config.topicName == undefined) {
    return <EmptyState>Configure a topic and message schema in the panel settings</EmptyState>;
  }

  return (
    <Stack fullHeight>
      <PanelToolbar />
      <Stack flex="auto" gap={1} padding={1.5} position="relative">
        {config.advancedView && (
          <Stack flexGrow="1">
            <TextField
              variant="outlined"
              className={classes.textarea}
              multiline
              size="small"
              placeholder="Enter message content as JSON"
              value={config.value}
              onChange={(event) => saveConfig({ value: event.target.value })}
              error={error != undefined}
            />
          </Stack>
        )}
        <Stack
          direction={config.advancedView ? "row" : "column"}
          justifyContent={config.advancedView ? "flex-end" : "center"}
          alignItems="center"
          overflow="hidden"
          flexGrow={0}
          gap={1.5}
        >
          {(error != undefined || !canPublish) && (
            <Typography variant="caption" noWrap color={error != undefined ? "error" : undefined}>
              {error ?? "Connect to a data source that supports publishing"}
            </Typography>
          )}
          <Button
            className={classes.button}
            variant="contained"
            title={
              canPublish
                ? config.buttonTooltip
                : "Connect to a data source that supports publishing"
            }
            disabled={!canPublish || parsedObject == undefined}
            onClick={onPublishClicked}
          >
            {config.buttonText}
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
      datatype: "",
      topicName: "",
      buttonText: "Publish",
      buttonTooltip: "",
      buttonColor: "#00A871",
      advancedView: true,
      value: "",
    },
  }),
);
