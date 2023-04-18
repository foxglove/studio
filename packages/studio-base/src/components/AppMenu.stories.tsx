// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { StoryObj } from "@storybook/react";
import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import AppMenu from "@foxglove/studio-base/components/AppMenu";
import PlayerSelectionContext, {
  PlayerSelection,
} from "@foxglove/studio-base/context/PlayerSelectionContext";

export default {
  title: "components/AppMenu",
  component: AppMenu,
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
  <PlayerSelectionContext.Provider value={playerSelection}>
    <AppMenu
      open
      anchorPosition={{ top: 0, left: 0 }}
      anchorReference="anchorPosition"
      disablePortal
      handleClose={() => {
        // no-op
      }}
    />
  </PlayerSelectionContext.Provider>
);

type Story = StoryObj<typeof Default>;

export const Dark = (): JSX.Element => <Default />;
Dark.parameters = { colorScheme: "dark" };

export const Light = (): JSX.Element => <Default />;
Light.parameters = { colorScheme: "light" };

const NestedMenuSelected = (id: string, colorScheme: "dark" | "light"): Story => ({
  render: () => <Default />,
  play: async () => {
    await userEvent.hover(screen.getByTestId(id));
  },
  parameters: { colorScheme },
});

export const DarkFileSelected = NestedMenuSelected("app-menu-file", "dark");
export const DarkEditSelected = NestedMenuSelected("app-menu-edit", "dark");
export const DarkViewSelected = NestedMenuSelected("app-menu-view", "dark");
export const DarkPlaybackSelected = NestedMenuSelected("app-menu-playback", "dark");
export const DarkPanelSelected = NestedMenuSelected("app-menu-panel", "dark");
export const DarkHelpSelected = NestedMenuSelected("app-menu-help", "dark");

export const LightFileSelected = NestedMenuSelected("app-menu-file", "light");
export const LightEditSelected = NestedMenuSelected("app-menu-edit", "light");
export const LightViewSelected = NestedMenuSelected("app-menu-view", "light");
export const LightPlaybackSelected = NestedMenuSelected("app-menu-playback", "light");
export const LightPanelSelected = NestedMenuSelected("app-menu-panel", "light");
export const LightHelpSelected = NestedMenuSelected("app-menu-help", "light");
