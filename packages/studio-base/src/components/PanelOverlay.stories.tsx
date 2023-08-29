// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  Delete20Regular,
  TabDesktop20Regular,
  TabDesktopMultiple20Regular,
  TableSimple20Regular,
} from "@fluentui/react-icons";
import { Meta, StoryObj } from "@storybook/react";
import { useRef } from "react";

import Stack from "@foxglove/studio-base/components/Stack";

import { PanelOverlay } from "./PanelOverlay";

export default {
  title: "components/PanelOverlay",
  component: PanelOverlay,
  args: {},
  decorators: [
    (Story, { args }) => {
      const ref = useRef<HTMLDivElement>(ReactNull);

      return (
        <Stack
          position="relative"
          justifyContent="center"
          alignItems="center"
          paddingTop={3.75}
          fullHeight
        >
          <Story {...args} quickActionsOverlayRef={ref} />
          Background content
        </Stack>
      );
    },
  ],
} as Meta<typeof PanelOverlay>;

type Story = StoryObj<typeof PanelOverlay>;

export const Default: Story = {};

export const ValidDropTarget: Story = {
  args: {
    open: true,
    variant: "validDropTarget",
    dropMessage: "View /topic_name/field_name",
  },
};

export const InvalidDropTarget: Story = {
  args: {
    open: true,
    variant: "invalidDropTarget",
    dropMessage: "View /topic_name/field_name",
  },
};

export const SelectedPanelActions: Story = {
  args: {
    open: true,
    variant: "selected",
    actions: [
      { key: "group", text: "Group in tab", icon: <TabDesktop20Regular /> },
      { key: "create-tabs", text: "Create tabs", icon: <TabDesktopMultiple20Regular /> },
    ],
  },
};

export const QuickActions: Story = {
  args: {
    open: true,
    variant: "selected",
    actions: [
      { key: "split", text: "Split panel", icon: <TableSimple20Regular /> },
      { key: "remove", text: "Remove panel", icon: <Delete20Regular />, color: "error" },
    ],
  },
};
