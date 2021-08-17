// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Pivot, PivotItem, Stack, StackItem, useTheme } from "@fluentui/react";
import { useCallback, useLayoutEffect, useMemo, useState } from "react";

import { definitions as commonDefs } from "@foxglove/rosmsg-msgs-common";
import { PanelExtensionContext, Topic } from "@foxglove/studio";

import DirectionalPad, { DirectionalPadAction } from "./DirectionalPad";
import Settings from "./Settings";
import { Config, DeepPartial } from "./types";

type TeleopPanelProps = {
  context: PanelExtensionContext;
};

function TeleopPanel(props: TeleopPanelProps): JSX.Element {
  const { context } = props;
  const { saveState } = context;
  const theme = useTheme();

  // resolve an initial config which may have some missing fields into a full config
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

  const [topics, setTopics] = useState<readonly Topic[] | undefined>();

  const onChangeConfig = useCallback(
    (newConfig: Config) => {
      setConfig(newConfig);
      saveState(newConfig);
    },
    [saveState],
  );

  // setup context render handler and render done handling
  const [renderDone, setRenderDone] = useState<() => void>(() => () => {});
  useLayoutEffect(() => {
    context.watch("topics");

    context.onRender = (renderState, done) => {
      setRenderDone(() => done);

      setTopics(renderState.topics);
    };
  }, [context]);

  // advertise topic
  const { topic: currentTopic } = config;
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
    (action: DirectionalPadAction) => {
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
        case DirectionalPadAction.UP:
          setFieldValue(config.upButton.field, config.upButton.value);
          break;
        case DirectionalPadAction.DOWN:
          setFieldValue(config.downButton.field, config.downButton.value);
          break;
        case DirectionalPadAction.LEFT:
          setFieldValue(config.leftButton.field, config.leftButton.value);
          break;
        case DirectionalPadAction.RIGHT:
          setFieldValue(config.rightButton.field, config.rightButton.value);
          break;
        default:
      }

      context.publish(currentTopic, message);
    },
    [context, config, currentTopic],
  );

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
            <DirectionalPad onClick={onAction} />
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
        <Settings topics={topicNames} config={config} onConfigChange={onChangeConfig} />
      </PivotItem>
    </Pivot>
  );
}

export default TeleopPanel;
