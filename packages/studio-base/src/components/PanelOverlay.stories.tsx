// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Meta, StoryObj } from "@storybook/react";
import { useRef } from "react";

import Stack from "@foxglove/studio-base/components/Stack";

import { PanelOverlay } from "./PanelOverlay";

export default {
  title: "components/PanelOverlay",
  component: PanelOverlay,
  args: {
    isDragging: false,
    isFullscreen: false,
    isOver: false,
    isSelected: false,
    isValidTarget: false,
    dropMessage: undefined,
    isNotTabPanel: true,
  },
  decorators: [
    (Story, { args }) => {
      const ref = useRef<HTMLDivElement>(ReactNull);

      return (
        <Stack position="relative" justifyContent="center" alignItems="center" fullHeight>
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
    isDragging: true,
    isOver: true,
    isValidTarget: true,
    dropMessage: "View /topic_name/field_name",
  },
};

export const InvalidDropTarget: Story = {
  args: {
    isDragging: true,
    isOver: true,
    isValidTarget: false,
  },
};

export const QuickActions: Story = {
  args: {
    // fix me
    connectOverlayDragSource: () => <div />,
    quickActionsKeyPressed: true,
  },
};

export const SelectionActions: Story = {
  args: {
    isSelected: true,
    selectedPanelCount: 99,
  },
};
