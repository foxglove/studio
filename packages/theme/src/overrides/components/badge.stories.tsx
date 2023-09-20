// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Alert24Filled } from "@fluentui/react-icons";
import { BadgeProps, Badge as MuiBadge } from "@mui/material";
import { Meta, StoryObj } from "@storybook/react";

import Stack from "@foxglove/studio-base/components/Stack";

const colors: BadgeProps["color"][] = [
  "default",
  "primary",
  "secondary",
  "error",
  "info",
  "success",
  "warning",
];

export default {
  component: MuiBadge,
  title: "theme/overrides",
  args: {
    badgeContent: 4,
    color: "primary",
    children: <Alert24Filled />,
  },
  decorators: [
    (Story) => (
      <div style={{ padding: 16 }}>
        <Story />
      </div>
    ),
  ],
} as Meta<typeof MuiBadge>;

export const Badge: StoryObj = {
  render: (args) => (
    <Stack direction="row" gap={2}>
      {colors.map((color) => (
        <MuiBadge key={color} {...{ ...args, color }} />
      ))}
    </Stack>
  ),
};
