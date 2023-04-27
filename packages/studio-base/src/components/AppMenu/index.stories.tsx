// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { StoryFn, StoryObj } from "@storybook/react";
import { screen, userEvent } from "@storybook/testing-library";

import { AppMenu } from "@foxglove/studio-base/components/AppMenu";
import PlayerSelectionContext, {
  PlayerSelection,
} from "@foxglove/studio-base/context/PlayerSelectionContext";
import WorkspaceContextProvider from "@foxglove/studio-base/providers/WorkspaceContextProvider";

export default {
  title: "components/AppMenu",
  component: AppMenu,
  decorators: [
    (Story: StoryFn): JSX.Element => (
      <WorkspaceContextProvider>
        <PlayerSelectionContext.Provider value={playerSelection}>
          <Story />
        </PlayerSelectionContext.Provider>
      </WorkspaceContextProvider>
    ),
  ],
};

// Connection
const playerSelection: PlayerSelection = {
  selectSource: () => {},
  selectRecent: () => {},
  recentSources: [
    // prettier-ignore
    { id: "1111", title: "NuScenes-v1.0-mini-scene-0655-reallllllllly-long-name-8829908290831091.bag", },
    { id: "2222", title: "http://localhost:11311", label: "ROS 1" },
    { id: "3333", title: "ws://localhost:9090/", label: "Rosbridge (ROS 1 & 2)" },
    { id: "4444", title: "ws://localhost:8765", label: "Foxglove WebSocket" },
    { id: "5555", title: "2369", label: "Velodyne Lidar" },
    { id: "6666", title: "THIS ITEM SHOULD BE HIDDEN IN STORYBOOKS", label: "!!!!!!!!!!!!" },
  ],
  availableSources: [],
};

export const Default = (): JSX.Element => (
  <AppMenu
    open
    anchorPosition={{ top: 0, left: 0 }}
    anchorReference="anchorPosition"
    disablePortal
    handleClose={() => {
      // no-op
    }}
  />
);

type Story = StoryObj<typeof Default>;

const NestedMenuSelected = (id: string, colorScheme: "dark" | "light"): Story => ({
  render: Default,
  parameters: { colorScheme },
  play: async () => userEvent.hover(screen.getByTestId(id)),
});

export const DarkFileSelected = NestedMenuSelected("app-menu-file", "dark");
DarkFileSelected.storyName = "File Menu (dark)";

export const DarkViewSelected = NestedMenuSelected("app-menu-view", "dark");
DarkViewSelected.storyName = "View Menu (dark)";

export const DarkHelpSelected = NestedMenuSelected("app-menu-help", "dark");
DarkHelpSelected.storyName = "Help Menu (dark)";

export const LightFileSelected = NestedMenuSelected("app-menu-file", "light");
LightFileSelected.storyName = "File Menu (light)";

export const LightViewSelected = NestedMenuSelected("app-menu-view", "light");
LightViewSelected.storyName = "View Menu (light)";

export const LightHelpSelected = NestedMenuSelected("app-menu-help", "light");
LightHelpSelected.storyName = "Help Menu (light)";
