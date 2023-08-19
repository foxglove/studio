// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  AddCircle12Regular,
  AddCircle16Regular,
  AddCircle20Regular,
  AddCircle24Regular,
  AddCircle28Regular,
  AddCircle32Regular,
} from "@fluentui/react-icons";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { IconButton as MuiIconButton } from "@mui/material";
import { Meta, StoryObj } from "@storybook/react";

import Stack from "@foxglove/studio-base/components/Stack";

const icons: { [key: string]: JSX.Element } = {
  "@fluentui/react-icons 12px": <AddCircle12Regular />,
  "@fluentui/react-icons 16px": <AddCircle16Regular />,
  "@fluentui/react-icons 20px": <AddCircle20Regular />,
  "@fluentui/react-icons 24px": <AddCircle24Regular />,
  "@fluentui/react-icons 28px": <AddCircle28Regular />,
  "@fluentui/react-icons 32px": <AddCircle32Regular />,

  "@mui/icons-material fontSize=`small`": <AddCircleOutlineIcon fontSize="small" />,
  "@mui/icons-material fontSize=`medium`": <AddCircleOutlineIcon fontSize="medium" />,
  "@mui/icons-material fontSize=`large`": <AddCircleOutlineIcon fontSize="large" />,
};

export default {
  component: MuiIconButton,
  title: "theme/overrides",
  args: {},
} as Meta<typeof MuiIconButton>;

export const IconButton: StoryObj = {
  render: (args) => (
    <Stack direction="row" justifyContent="center" alignItems="center" padding={2}>
      {Object.entries(icons).map(([key, icon]) => (
        <Stack key={key} alignItems="center" gap={2}>
          <MuiIconButton title={key} {...args} size="small" key={key}>
            {icon}
          </MuiIconButton>
          <MuiIconButton title={key} {...args} size="medium" key={key}>
            {icon}
          </MuiIconButton>
          <MuiIconButton title={key} {...args} size="large" key={key}>
            {icon}
          </MuiIconButton>
        </Stack>
      ))}
    </Stack>
  ),
};
