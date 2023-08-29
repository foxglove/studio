// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Paper } from "@mui/material";
import { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/testing-library";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import MockMessagePipelineProvider from "@foxglove/studio-base/components/MessagePipeline/MockMessagePipelineProvider";
import { PlayerCapabilities, TopicStats } from "@foxglove/studio-base/players/types";

import { TopicList } from "./TopicList";
import { datatypes, topics } from "./mocks";

const topicStats = new Map<string, TopicStats>([
  // [
  //   "/topic_1",
  //   {
  //     numMessages: 1234,
  //     firstMessageTime: { sec: 1, nsec: 0 },
  //     lastMessageTime: { sec: 2, nsec: 0 },
  //   },
  // ],
  // [
  //   "/topic_2",
  //   {
  //     numMessages: 3456,
  //     firstMessageTime: { sec: 1, nsec: 0 },
  //     lastMessageTime: { sec: 2, nsec: 0 },
  //   },
  // ],
]);

export default {
  title: "components/TopicList",
  args: {
    datatypes,
    capabilities: [PlayerCapabilities.playbackControl],
    topics,
    topicStats,
  },
  render: (args) => (
    <DndProvider backend={HTML5Backend}>
      <MockMessagePipelineProvider {...args}>
        <Paper square style={{ height: "100%" }}>
          <TopicList />
        </Paper>
      </MockMessagePipelineProvider>
    </DndProvider>
  ),
} as Meta<typeof MockMessagePipelineProvider>;

type Story = StoryObj<typeof MockMessagePipelineProvider>;

export const Default: Story = {};

export const FilterByTopicName: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const filterInputs = await canvas.findAllByPlaceholderText("Filter by topic or schema name…");

    for (const input of filterInputs) {
      await userEvent.type(input, "CAM_BACK/camera_info");
    }
  },
};

export const FilterBySchemaName: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const filterInputs = await canvas.findAllByPlaceholderText("Filter by topic or schema name…");

    for (const input of filterInputs) {
      await userEvent.type(input, "diagnostic_msgs/");
    }
  },
};

export const FilterTextCleared: Story = {
  play: async ({ canvasElement }) => {
    const user = userEvent.setup();
    const canvas = within(canvasElement);
    const filterInputs = await canvas.findAllByPlaceholderText("Filter by topic or schema name…");

    for (const input of filterInputs) {
      await user.type(input, "/topic_1");
    }

    const clearButtons = await canvas.findAllByTitle("Clear filter");

    for (const button of clearButtons) {
      await user.click(button);
    }
  },
};
