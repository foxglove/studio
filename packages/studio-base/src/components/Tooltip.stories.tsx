// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Info20Regular } from "@fluentui/react-icons";
import { IconButton } from "@mui/material";
import { Meta, StoryObj } from "@storybook/react";
import * as _ from "lodash-es";
import { PlacesType } from "react-tooltip";

import Stack from "@foxglove/studio-base/components/Stack";
import { Tooltip } from "@foxglove/studio-base/components/Tooltip";

export default {
  component: Tooltip,
  title: "components/Tooltip",
} as Meta<typeof Tooltip>;

export const Default: StoryObj = {
  render: () => (
    <>
      <Stack direction="row" gap={10} padding={10} justifyContent="center" alignItems="center">
        {["left", "top", "bottom", "right"].map((place) => {
          const id = _.uniqueId(`test-tooltip-${place}-`);

          return (
            <div key={place}>
              <IconButton data-tooltip-id={id}>
                <Info20Regular />
              </IconButton>
              <Tooltip isOpen id={id} placement={place as PlacesType}>
                Tooltip content
              </Tooltip>
            </div>
          );
        })}
      </Stack>
    </>
  ),
  parameters: {
    colorScheme: "both-column",
  },
};
