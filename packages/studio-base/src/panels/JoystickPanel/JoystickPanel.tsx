// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  Dropdown,
  IDropdownOption,
  Label,
  Pivot,
  PivotItem,
  Stack,
  StackItem,
  Text,
  TextField,
  Toggle,
  useTheme,
} from "@fluentui/react";
import { useCallback, useLayoutEffect, useMemo, useState } from "react";

import { definitions as commonDefs } from "@foxglove/rosmsg-msgs-common";
import { PanelExtensionContext, Topic } from "@foxglove/studio";
import Autocomplete from "@foxglove/studio-base/components/Autocomplete";

import Joystick, { JoystickAction } from "./Joystick";

type JoystickPanelProps = {
  context: PanelExtensionContext;
};

type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

type Config = {
  topic?: string;
  upButton: {
    field: string;
    value: number;
  };
  downButton: {
    field: string;
    value: number;
  };
  leftButton: {
    field: string;
    value: number;
  };
  rightButton: {
    field: string;
    value: number;
  };
};

function JoystickPanel(props: JoystickPanelProps): JSX.Element {
  const { context } = props;
  const { saveState } = context;
  const theme = useTheme();

  const [config, setConfig] = useState<Config>(() => {
    const partialConfig = context.initialState as DeepPartial<Config>;

    const {
      topic,
      upButton: { field: upField = "linear-x", value: upValue = 1 } = {},
      downButton: { field: downField = "linear-x", value: downValue = -1 } = {},
      leftButton: { field: leftField = "angular-z", value: leftValue = 1 } = {},
      rightButton: { field: rightField = "angular-z", value: rightValue = -1 } = {},
    } = partialConfig;

    return {
      topic,
      upButton: { field: upField, value: upValue },
      downButton: { field: downField, value: downValue },
      leftButton: { field: leftField, value: leftValue },
      rightButton: { field: rightField, value: rightValue },
    };
  });

  // user entered current topic
  const [currentTopic, setCurrentTopic] = useState<string | undefined>(config.topic);

  const [topics, setTopics] = useState<readonly Topic[] | undefined>();

  const onChangeTopic = useCallback(
    (_ev: unknown, text: string) => {
      setCurrentTopic(text);
      saveState({ topic: text });
    },
    [saveState],
  );

  const onSelectTopic = useCallback(
    (text: string) => {
      setCurrentTopic(text);
      saveState({ topic: text });
    },
    [saveState],
  );

  const saveConfig = useCallback(
    (partial: Partial<Config>) => {
      setConfig((currentConfig) => {
        const full = Object.assign({}, currentConfig, partial);
        saveState(full);
        return full;
      });
    },
    [saveState],
  );

  // setup context render handler
  const [renderDone, setRenderDone] = useState<() => void>(() => () => {});

  useLayoutEffect(() => {
    context.watch("topics");

    context.onRender = (renderState, done) => {
      setRenderDone(() => done);

      setTopics(renderState.topics);
    };
  }, [context]);

  // advertise topic
  useLayoutEffect(() => {
    if (!currentTopic) {
      return;
    }

    context.advertise(currentTopic, "geometry_msgs/Twist", {
      datatypes: new Map([
        ["geometry_msgs/Vector3", commonDefs["geometry_msgs/Vector3"]],
        ["geometry_msgs/Twist", commonDefs["geometry_msgs/Twist"]],
      ]),
    });

    return () => {
      context.unadvertise(currentTopic);
    };
  }, [context, currentTopic]);

  const topicNames = useMemo(() => {
    if (!topics) {
      return [];
    }

    return topics.map((topic) => topic.name);
  }, [topics]);

  const onAction = useCallback(
    (action: JoystickAction) => {
      if (!currentTopic) {
        return;
      }

      const message = {
        linear: {
          x: 0,
          y: 0,
          z: 0,
        },
        angular: {
          x: 0,
          y: 0,
          z: 0,
        },
      };

      function setFieldValue(field: string, value: number) {
        switch (field) {
          case "linear-x":
            message.linear.x = value;
            break;
          case "linear-y":
            message.linear.y = value;
            break;
          case "linear-z":
            message.linear.z = value;
            break;
          case "angular-x":
            message.angular.x = value;
            break;
          case "angular-y":
            message.angular.y = value;
            break;
          case "angular-z":
            message.angular.z = value;
            break;
        }
      }

      switch (action) {
        case JoystickAction.UP:
          setFieldValue(config.upButton.field, config.upButton.value);
          break;
        case JoystickAction.DOWN:
          setFieldValue(config.downButton.field, config.downButton.value);
          break;
        case JoystickAction.LEFT:
          setFieldValue(config.leftButton.field, config.leftButton.value);
          break;
        case JoystickAction.RIGHT:
          setFieldValue(config.rightButton.field, config.rightButton.value);
          break;
        default:
      }

      context.publish(currentTopic, message);
    },
    [context, config, currentTopic],
  );

  const dropDownOptions = useMemo<IDropdownOption[]>(() => {
    return [
      { key: "linear-x", text: "Linear X" },
      { key: "linear-y", text: "Linear Y" },
      { key: "linear-z", text: "Linear Z" },
      { key: "angular-x", text: "Angular X" },
      { key: "angular-y", text: "Angular Y" },
      { key: "angular-z", text: "Angular Z" },
    ];
  }, []);

  useLayoutEffect(() => {
    renderDone();
  }, [renderDone]);

  return (
    <Pivot styles={{ root: { backgroundColor: theme.semanticColors.bodyBackground } }}>
      <PivotItem
        headerText="Controls"
        headerButtonProps={{
          "data-order": 1,
          "data-title": "Controls",
        }}
      >
        <Stack verticalFill tokens={{ padding: theme.spacing.l1, childrenGap: theme.spacing.m }}>
          <StackItem grow={1}>
            <Joystick onClick={onAction} />
          </StackItem>
        </Stack>
      </PivotItem>
      <PivotItem
        headerText="Settings"
        headerButtonProps={{
          "data-order": 2,
          "data-title": "Setting",
        }}
      >
        <Stack verticalFill tokens={{ padding: theme.spacing.l1, childrenGap: theme.spacing.m }}>
          <StackItem>
            <Text>Publish Topic</Text>
            <Stack
              tokens={{
                padding: `${theme.spacing.s1} 0`,
              }}
            >
              <Autocomplete
                placeholder="Enter a topic"
                items={topicNames}
                hasError={false}
                onChange={onChangeTopic}
                onSelect={onSelectTopic}
                selectedItem={currentTopic}
                inputStyle={{
                  padding: theme.spacing.s1,
                  border: `1px solid ${theme.semanticColors.inputBorder}`,
                  backgroundColor: theme.semanticColors.inputBackground,
                }}
              />
            </Stack>
          </StackItem>
          <StackItem grow>
            <Toggle label="Show stop button" />
          </StackItem>
          <StackItem grow>
            <Stack horizontal verticalAlign="end" tokens={{ childrenGap: theme.spacing.m }}>
              <StackItem grow>
                <Label>Up Button:</Label>
              </StackItem>
              <Dropdown
                label="Field"
                selectedKey={config.upButton.field}
                options={dropDownOptions}
                styles={{ root: { minWidth: 96 } }}
                onChange={(_ev, option) => {
                  if (option?.key == undefined) {
                    return;
                  }

                  saveConfig({
                    upButton: { field: String(option.key), value: config.upButton.value },
                  });
                }}
              />
              <TextField
                type="number"
                label="Value"
                value={String(config.upButton.value)}
                onChange={(_ev, value) => {
                  if (!value || isNaN(+value)) {
                    return;
                  }

                  saveConfig({
                    upButton: { field: config.upButton.field, value: +value },
                  });
                }}
              />
            </Stack>
          </StackItem>
          <StackItem>
            <Stack horizontal verticalAlign="center" tokens={{ childrenGap: theme.spacing.m }}>
              <StackItem grow>
                <Label>Down Button:</Label>
              </StackItem>
              <Dropdown
                selectedKey={config.downButton.field}
                options={dropDownOptions}
                styles={{ root: { minWidth: 96 } }}
                onChange={(_ev, option) => {
                  if (option?.key == undefined) {
                    return;
                  }

                  saveConfig({
                    downButton: { field: String(option.key), value: config.downButton.value },
                  });
                }}
              />
              <TextField
                type="number"
                value={String(config.downButton.value)}
                onChange={(_ev, value) => {
                  if (!value || isNaN(+value)) {
                    return;
                  }

                  saveConfig({
                    downButton: { field: config.downButton.field, value: +value },
                  });
                }}
              />
            </Stack>
          </StackItem>
          <StackItem>
            <Stack horizontal verticalAlign="center" tokens={{ childrenGap: theme.spacing.m }}>
              <StackItem grow>
                <Label>Left Button:</Label>
              </StackItem>
              <Dropdown
                selectedKey={config.leftButton.field}
                options={dropDownOptions}
                styles={{ root: { minWidth: 96 } }}
                onChange={(_ev, option) => {
                  if (option?.key == undefined) {
                    return;
                  }

                  saveConfig({
                    leftButton: { field: String(option.key), value: config.leftButton.value },
                  });
                }}
              />
              <TextField
                type="number"
                value={String(config.leftButton.value)}
                onChange={(_ev, value) => {
                  if (!value || isNaN(+value)) {
                    return;
                  }

                  saveConfig({
                    leftButton: { field: config.leftButton.field, value: +value },
                  });
                }}
              />
            </Stack>
          </StackItem>
          <StackItem>
            <Stack horizontal verticalAlign="center" tokens={{ childrenGap: theme.spacing.m }}>
              <StackItem grow>
                <Label>Right Button:</Label>
              </StackItem>
              <Dropdown
                selectedKey={config.rightButton.field}
                options={dropDownOptions}
                styles={{ root: { minWidth: 96 } }}
                onChange={(_ev, option) => {
                  if (option?.key == undefined) {
                    return;
                  }

                  saveConfig({
                    rightButton: { field: String(option.key), value: config.rightButton.value },
                  });
                }}
              />
              <TextField
                type="number"
                value={String(config.rightButton.value)}
                onChange={(_ev, value) => {
                  if (!value || isNaN(+value)) {
                    return;
                  }

                  saveConfig({
                    rightButton: { field: config.rightButton.field, value: +value },
                  });
                }}
              />
            </Stack>
          </StackItem>
        </Stack>
      </PivotItem>
    </Pivot>
  );
}

export default JoystickPanel;
