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

import Publish, { Config } from "@foxglove/studio-base/panels/Publish";
import { PlayerCapabilities } from "@foxglove/studio-base/players/types";
import PanelSetup, { Fixture } from "@foxglove/studio-base/stories/PanelSetup";

const getFixture = ({ allowPublish }: { allowPublish: boolean }): Fixture => {
  return {
    topics: [],
    datatypes: new Map(
      Object.entries({
        "std_msgs/String": { definitions: [{ name: "data", type: "string" }] },
      }),
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

const baseConfig: Config = {
  topicName: "/sample_topic",
  schemaName: "std_msgs/String",
  buttonText: "Publish",
  buttonTooltip: "",
  buttonColor: "",
  advancedView: true,
  value: advancedJSON,
};

type StoryArgs = {
  allowPublish: boolean;
  includeSettings: boolean;
  isEmpty: boolean;
  overrideConfig: Config;
};

export default {
  title: "panels/Publish",
  component: Publish,
  args: {
    allowPublish: true,
    isEmpty: false,
    includeSettings: false,
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

export const DefaultWithSettings: Story = {
  args: { includeSettings: true },
};

export const ExampleCanPublishAdvanced: Story = {
  args: { overrideConfig: { ...baseConfig, advancedView: true } },
  name: "example can publish, advanced",
};

export const CustomButtonColor: Story = {
  args: {
    overrideConfig: {
      ...baseConfig,
      advancedView: true,
      value: advancedJSON,
      buttonColor: "#ffbf49",
    },
  },
  name: "custom button color",
};

export const ExampleCantPublishAdvanced: Story = {
  args: {
    allowPublish: false,
    overrideConfig: { ...baseConfig, advancedView: true },
  },
  name: "example can't publish, advanced",
};

export const ExampleCantPublishNotAdvanced: Story = {
  args: {
    allowPublish: false,
    overrideConfig: { ...baseConfig, advancedView: false },
  },
  name: "example can't publish, not advanced",
};

export const ExampleWithDatatypeThatNoLongerExists: Story = {
  args: {
    isEmpty: true,
    overrideConfig: { ...baseConfig, advancedView: true },
  },
  name: "Example with datatype that no longer exists",
};

const validJSON = `{\n  "a": 1,\n  "b": 2,\n  "c": 3\n}`;

export const ExampleWithValidPresetJson: Story = {
  args: {
    overrideConfig: { ...baseConfig, advancedView: true, value: validJSON },
  },
  name: "example with valid preset JSON",
};

const invalidJSON = `{\n  "a": 1,\n  'b: 2,\n  "c": 3\n}`;

export const ExampleWithInvalidPresetJson: Story = {
  args: {
    overrideConfig: { ...baseConfig, advancedView: true, value: invalidJSON },
  },
  name: "example with invalid preset JSON",
};
