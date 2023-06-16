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

import { action } from "@storybook/addon-actions";
import { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/testing-library";

import { PlayerCapabilities } from "@foxglove/studio-base/players/types";
import PanelSetup, { Fixture } from "@foxglove/studio-base/stories/PanelSetup";

import Publish from "./index";
import { PublishConfig } from "./types";

const getFixture = ({ allowPublish }: { allowPublish: boolean }): Fixture => {
  return {
    topics: [{ name: "/sample_topic", schemaName: "std_msgs/String" }],
    datatypes: new Map(
      Object.entries({ "std_msgs/String": { definitions: [{ name: "data", type: "string" }] } }),
    ),
    frame: {},
    capabilities: allowPublish ? [PlayerCapabilities.advertise] : [],
    publish: action("publish"),
    setPublishers: action("setPublishers"),
  };
};

const emptyFixture: Fixture = {
  topics: [],
  datatypes: new Map(),
  frame: {},
  capabilities: [],
};

const advancedJSON = `{\n  "data": ""\n}`;

const baseConfig: PublishConfig = {
  topicName: "/sample_topic",
  datatype: "std_msgs/String",
  advancedView: true,
  value: advancedJSON,
};

type StoryArgs = {
  allowPublish: boolean;
  includeSettings: boolean;
  isEmpty: boolean;
  overrideConfig: PublishConfig;
};

export default {
  title: "panels/Publish",
  component: Publish,
  args: {
    allowPublish: false,
    includeSettings: true,
    isEmpty: false,
  },
  parameters: {
    colorScheme: "both-column",
  },
  decorators: [
    (Story, ctx) => {
      const {
        args: { allowPublish, includeSettings, isEmpty, ...args },
      } = ctx;
      return (
        <PanelSetup
          includeSettings={includeSettings}
          fixture={isEmpty ? emptyFixture : getFixture({ allowPublish })}
        >
          <Story {...{ args }} />
        </PanelSetup>
      );
    },
  ],
} as Meta<StoryArgs>;

type Story = StoryObj<StoryArgs>;

export const Default: Story = {};

export const PublishEnabled: Story = {
  args: { allowPublish: true },
};

export const PublishEnabledWithTopicAndSchema: Story = {
  args: {
    allowPublish: true,
    overrideConfig: { ...baseConfig },
  },
  name: "Publish Enabled with topic and schema",
};

export const PublishEnabledWithCustomButtonSettings: Story = {
  args: {
    allowPublish: true,
    overrideConfig: {
      ...baseConfig,
      buttonColor: "#ffbf49",
      buttonTooltip: "I am a button tooltip",
      buttonText: "Send message",
    },
  },
  name: "Publish Enabled with custom button settings",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const buttons = await canvas.findAllByText("Send message");

    buttons.forEach((button) => userEvent.hover(button));
  },
};

export const PublishDisabledWithTopicAndSchema: Story = {
  args: {
    allowPublish: false,
    overrideConfig: {
      ...baseConfig,
    },
  },
  name: "Publish Disabled with topic and schema",
};

const validJSON = `{\n  "a": 1,\n  "b": 2,\n  "c": 3\n}`;

export const WithValidJSON: Story = {
  args: {
    allowPublish: true,
    overrideConfig: {
      ...baseConfig,
      value: validJSON,
    },
  },
  name: "Publish Enabled with valid JSON",
};

const invalidJSON = `{\n  "a": 1,\n  'b: 2,\n  "c": 3\n}`;

export const WithInvalidJSON: Story = {
  args: {
    allowPublish: true,
    overrideConfig: {
      ...baseConfig,
      value: invalidJSON,
    },
  },
  name: "Publish Enabled with invalid JSON",
};

export const WithSchemaThatNoLongerExists: Story = {
  args: {
    allowPublish: true,
    isEmpty: true,
    overrideConfig: {
      ...baseConfig,
      advancedView: true,
    },
  },
  name: "Publish Enabled with schema that no longer exists",
};

export const DefaultEditingModeOff: Story = {
  args: { overrideConfig: { advancedView: false } },
  name: "Default (editing mode off)",
};

export const PublishEnabledEditingOff: Story = {
  args: {
    allowPublish: true,
    overrideConfig: { advancedView: false },
  },
  name: "Publish Enabled (editing mode off)",
};

export const PublishEnabledWithTopicAndSchemaEditingOff: Story = {
  args: {
    allowPublish: true,
    overrideConfig: {
      ...baseConfig,
      advancedView: false,
    },
  },
  name: "Publish Enabled with topic and schema (editing mode off)",
};

export const PublishEnabledWithCustomButtonSettingsEditingOff: Story = {
  args: {
    allowPublish: true,
    overrideConfig: {
      ...baseConfig,
      buttonColor: "#ffbf49",
      buttonText: "Send message",
      buttonTooltip: "I am a button tooltip",
      advancedView: false,
    },
  },
  name: "Publish Enabled with custom button settings (editing mode off)",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const buttons = await canvas.findAllByText("Send message");

    buttons.forEach((button) => userEvent.hover(button));
  },
};

export const PublishDisabledEditingModeOff: Story = {
  args: {
    overrideConfig: {
      ...baseConfig,
      advancedView: false,
    },
  },
  name: "Publish Disabled (editing mode off)",
};
