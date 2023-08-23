// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { expect } from "@storybook/jest";
import { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/testing-library";

import CallService from "@foxglove/studio-base/panels/CallService";
import { PlayerCapabilities } from "@foxglove/studio-base/players/types";
import PanelSetup, { Fixture } from "@foxglove/studio-base/stories/PanelSetup";
import delay from "@foxglove/studio-base/util/delay";

import { Config } from "./types";

const getFixture = ({ allowCallService }: { allowCallService: boolean }): Fixture => {
  const callService = async (service: string, _request: unknown) => {
    if (service !== baseConfig.serviceName) {
      throw new Error(`Service "${service}" does not exist`);
    }

    return { success: true };
  };

  return {
    datatypes: new Map(
      Object.entries({
        "std_srvs/SetBool_Request": { definitions: [{ name: "data", type: "bool" }] },
      }),
    ),
    frame: {},
    capabilities: allowCallService ? [PlayerCapabilities.callServices] : [],
    callService,
  };
};

const emptyFixture: Fixture = {
  topics: [],
  datatypes: new Map(),
  frame: {},
  capabilities: [],
};

const successJSON = JSON.stringify({ success: true }, undefined, 2);
const advancedJSON = `{\n  "data": true\n}`;

const baseConfig: Config = {
  serviceName: "/set_bool",
  requestPayload: advancedJSON,
};

type StoryArgs = {
  allowCallService: boolean;
  includeSettings: boolean;
  isEmpty: boolean;
  overrideConfig: Config;
};

export default {
  title: "panels/CallService",
  component: CallService,
  args: {
    allowCallService: false,
    includeSettings: true,
    isEmpty: false,
  },
  parameters: {
    colorScheme: "both-column",
  },
  decorators: [
    (Story, ctx) => {
      const {
        args: { allowCallService, includeSettings, isEmpty, ...args },
      } = ctx;
      return (
        <PanelSetup
          includeSettings={includeSettings}
          fixture={isEmpty ? emptyFixture : getFixture({ allowCallService })}
        >
          <Story {...{ args }} />
        </PanelSetup>
      );
    },
  ],
} as Meta<StoryArgs>;

type Story = StoryObj<StoryArgs>;

export const Default: Story = {};

export const DefaultHorizontalLayout: Story = {
  args: { overrideConfig: { layout: "horizontal" } },
};

export const CallServiceEnabled: Story = {
  args: { allowCallService: true },
};

export const CallServiceEnabledServiceName: Story = {
  args: {
    allowCallService: true,
    overrideConfig: { ...baseConfig },
  },
  name: "CallService Enabled with service name",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const responseTextareas = await canvas.findAllByPlaceholderText("Response");
    const buttons = await canvas.findAllByText("Call service");
    buttons.forEach(async (button) => await userEvent.click(button));
    await delay(500);
    responseTextareas.forEach((textarea) => expect(textarea).toHaveValue(successJSON));
  },
};

export const CallServiceEnabledWithCustomButtonSettings: Story = {
  args: {
    allowCallService: true,
    overrideConfig: {
      ...baseConfig,
      buttonColor: "#ffbf49",
      buttonTooltip: "I am a button tooltip",
      buttonText: "Call that funky service",
    },
  },
  name: "CallService Enabled with custom button settings",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const buttons = await canvas.findAllByText("Call that funky service");

    buttons.forEach(async (button) => await userEvent.hover(button));
  },
};

const validJSON = `{\n  "a": 1,\n  "b": 2,\n  "c": 3\n}`;

export const WithValidJSON: Story = {
  args: {
    allowCallService: true,
    overrideConfig: {
      ...baseConfig,
      requestPayload: validJSON,
    },
  },
  name: "CallService Enabled with valid JSON",
};

const invalidJSON = `{\n  "a": 1,\n  'b: 2,\n  "c": 3\n}`;

export const WithInvalidJSON: Story = {
  args: {
    allowCallService: true,
    overrideConfig: {
      ...baseConfig,
      requestPayload: invalidJSON,
    },
  },
  name: "CallService Enabled with invalid JSON",
};

export const ServiceDoesNotExist: Story = {
  args: {
    allowCallService: true,
    overrideConfig: {
      ...baseConfig,
      serviceName: "/non_existing_service",
    },
  },
  name: "CallService Enabled with non existing service",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const responseTextareas = await canvas.findAllByPlaceholderText("Response");
    const buttons = await canvas.findAllByText("Call service");
    buttons.forEach(async (button) => await userEvent.click(button));
    await delay(500);
    responseTextareas.forEach((textarea) =>
      expect(textarea).toHaveValue(`Service "/non_existing_service" does not exist`),
    );
  },
};
