// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Story } from "@storybook/react";

import MockMessagePipelineProvider from "@foxglove/studio-base/components/MessagePipeline/MockMessagePipelineProvider";

import { CreateEventDialog } from "./CreateEventDialog";

export default {
  component: CreateEventDialog,
  title: "components/CreateEventDialog",
  decorators: [
    (StoryFn: Story): JSX.Element => (
      <MockMessagePipelineProvider>
        <StoryFn />
      </MockMessagePipelineProvider>
    ),
  ],
  parameters: {
    colorScheme: "light",
  },
};

export function Default(): JSX.Element {
  return <CreateEventDialog onClose={() => undefined} />;
}
