// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Autocomplete, TextField } from "@mui/material";
import { Meta, StoryObj } from "@storybook/react";

export default {
  component: Autocomplete,
  title: "theme/overrides/AutoComplete",
  args: {
    renderInput: (params) => <TextField {...params} />,
  },
} as Meta<typeof Autocomplete>;

export const Default: StoryObj = {};
