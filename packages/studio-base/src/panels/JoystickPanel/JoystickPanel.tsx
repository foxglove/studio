// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  Dropdown,
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

// import { definitions as commonDefs } from "@foxglove/rosmsg-msgs-common";
import { PanelExtensionContext, Topic } from "@foxglove/studio";
import Autocomplete from "@foxglove/studio-base/components/Autocomplete";
import { isNonEmptyOrUndefined } from "@foxglove/studio-base/util/emptyOrUndefined";

import Joystick from "./Joystick";

type JoystickPanelProps = {
  context: PanelExtensionContext;
};

//const Vector3Message = commonDefs["geometry_msgs/Vector3"];
//const TwistMessage = commonDefs["geometry_msgs/Twist"];

type Config = {
  topic?: string;
};

function JoystickPanel(props: JoystickPanelProps): JSX.Element {
  const { context } = props;
  const theme = useTheme();

  const config = context.initialState as Config;

  // user entered current topic
  const [currentTopic, setCurrentTopic] = useState<string | undefined>(config.topic);

  const [topics, setTopics] = useState<readonly Topic[] | undefined>();

  const onChangeTopic = useCallback((_ev: unknown, text: string) => {
    setCurrentTopic(text);
  }, []);

  const onSelectTopic = useCallback((text: string) => {
    setCurrentTopic(text);
  }, []);

  // setup context render handler
  useLayoutEffect(() => {
    context.watch("topics");

    context.onRender = (renderState) => {
      setTopics(renderState.topics);
    };
  }, [context]);

  // advertise topic
  useLayoutEffect(() => {
    if (!isNonEmptyOrUndefined(currentTopic)) {
      return;
    }

    // fixme - user needs to select a topic
    // context.advertise(currentTopic, "geometry_msgs/Twist");

    return () => {
      // context.unadvertise(currentTopic);
    };
  }, [context, currentTopic]);

  const topicNames = useMemo(() => {
    if (!topics) {
      return [];
    }

    return topics.map((topic) => topic.name);
  }, [topics]);

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
            <Joystick />
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
                label="Message"
                defaultSelectedKey="z"
                options={[
                  { key: "x", text: "x" },
                  { key: "y", text: "y" },
                  { key: "z", text: "z" },
                ]}
                styles={{ root: { minWidth: 96 } }}
              />
              <TextField type="number" label="Increment" defaultValue="3" />
            </Stack>
          </StackItem>
          <StackItem>
            <Stack horizontal verticalAlign="center" tokens={{ childrenGap: theme.spacing.m }}>
              <StackItem grow>
                <Label>Down Button:</Label>
              </StackItem>
              <Dropdown
                defaultSelectedKey="z"
                options={[
                  { key: "x", text: "x" },
                  { key: "y", text: "y" },
                  { key: "z", text: "z" },
                ]}
                styles={{ root: { minWidth: 96 } }}
              />
              <TextField type="number" defaultValue="3" />
            </Stack>
          </StackItem>
          <StackItem>
            <Stack horizontal verticalAlign="center" tokens={{ childrenGap: theme.spacing.m }}>
              <StackItem grow>
                <Label>Left Button:</Label>
              </StackItem>
              <Dropdown
                defaultSelectedKey="x"
                options={[
                  { key: "x", text: "x" },
                  { key: "y", text: "y" },
                  { key: "z", text: "z" },
                ]}
                styles={{ root: { minWidth: 96 } }}
              />
              <TextField defaultValue="6.28" type="number" />
            </Stack>
          </StackItem>
          <StackItem>
            <Stack horizontal verticalAlign="center" tokens={{ childrenGap: theme.spacing.m }}>
              <StackItem grow>
                <Label>Right Button:</Label>
              </StackItem>
              <Dropdown
                defaultSelectedKey="x"
                options={[
                  { key: "x", text: "x" },
                  { key: "y", text: "y" },
                  { key: "z", text: "z" },
                ]}
                styles={{ root: { minWidth: 96 } }}
              />
              <TextField defaultValue="-6.28" type="number" />
            </Stack>
          </StackItem>
        </Stack>
      </PivotItem>
    </Pivot>
  );
}

export default JoystickPanel;
