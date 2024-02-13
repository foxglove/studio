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

import { StoryObj } from "@storybook/react";
import { screen, userEvent } from "@storybook/testing-library";

import MockMessagePipelineProvider from "@foxglove/studio-base/components/MessagePipeline/MockMessagePipelineProvider";
import PlaybackSpeedControls from "@foxglove/studio-base/components/PlaybackSpeedControls";
import MockCurrentLayoutProvider from "@foxglove/studio-base/providers/CurrentLayoutProvider/MockCurrentLayoutProvider";
import WorkspaceContextProvider, {
  WorkspaceContextProviderProps,
} from "@foxglove/studio-base/providers/WorkspaceContextProvider";

type Story = StoryObj<typeof WorkspaceContextProvider>;

export default {
  title: "components/PlaybackSpeedControls",
  parameters: { colorScheme: "dark" },
  component: PlaybackSpeedControls,
  decorators: [
    (
      WrappedStory: typeof PlaybackSpeedControls,
      { args }: { args: WorkspaceContextProviderProps },
    ): JSX.Element => (
      <WorkspaceContextProvider initialState={args.initialState} disablePersistenceForStorybook>
        <MockCurrentLayoutProvider>
          <MockMessagePipelineProvider>
            <div style={{ padding: 20, paddingTop: 300 }}>
              <WrappedStory disabled={false} />
            </div>
          </MockMessagePipelineProvider>
        </MockCurrentLayoutProvider>
      </WorkspaceContextProvider>
    ),
  ],
  play: async (): Promise<void> => {
    const el = await screen.findByTestId<HTMLInputElement>("PlaybackSpeedControls-Dropdown");
    if (!el.disabled) {
      await userEvent.click(el);
    }
  },
};

export const WithoutASpeedFromTheWorkspace: Story = {
  name: "without a speed from the workspace",
  args: {
    initialState: {},
  },
};

export const WithASpeed: Story = {
  name: "with a speed",
  args: {
    initialState: {
      playbackControls: {
        repeat: false,
        speed: 2,
      },
    },
  },
};

export const WithAVerySmallSpeed: Story = {
  name: "with a very small speed",
  args: {
    initialState: {
      playbackControls: {
        repeat: false,
        speed: 0.01,
      },
    },
  },
};
