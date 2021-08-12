// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Stack, StackItem } from "@fluentui/react";
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
    <Stack verticalFill style={{ flexFlow: "inherit" }}>
      <StackItem>
        <Autocomplete
          placeholder="Enter a topic"
          items={topicNames}
          hasError={false}
          onChange={onChangeTopic}
          onSelect={onSelectTopic}
          selectedItem={currentTopic}
        />
      </StackItem>
      <StackItem grow={1}>
        <Joystick />
      </StackItem>
    </Stack>
  );
}

export default JoystickPanel;
