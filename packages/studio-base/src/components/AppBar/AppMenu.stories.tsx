// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { StoryFn, StoryObj } from "@storybook/react";
import { screen, userEvent } from "@storybook/testing-library";

import PlayerSelectionContext, {
  PlayerSelection,
} from "@foxglove/studio-base/context/PlayerSelectionContext";
import WorkspaceContextProvider from "@foxglove/studio-base/providers/WorkspaceContextProvider";

import { AppMenu } from "./AppMenu";

export default {
  title: "components/AppBar/AppMenu",
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

export const Default: StoryObj = {
  render: () => (
    <AppMenu
      open
      anchorPosition={{ top: 0, left: 0 }}
      anchorReference="anchorPosition"
      disablePortal
      handleClose={() => {
        // no-op
      }}
    />
  ),
};

const NestedMenuSelected = (
  id: string,
  colorScheme: "dark" | "light",
  forceLanguage?: "zn" | "ja",
): StoryObj => ({
  ...Default,
  parameters: { colorScheme, forceLanguage },
  play: async () => userEvent.hover(screen.getByTestId(id)),
});

export const FileMenuDark = NestedMenuSelected("app-menu-file", "dark");
export const FileMenuDarkChinese = NestedMenuSelected("app-menu-file", "dark", "zn");
export const FileMenuDarkJapanese = NestedMenuSelected("app-menu-file", "dark", "ja");

export const ViewMenuDark = NestedMenuSelected("app-menu-view", "dark");
export const ViewMenuDarkChinese = NestedMenuSelected("app-menu-view", "dark", "zn");
export const ViewMenuDarkJapanese = NestedMenuSelected("app-menu-view", "dark", "ja");

export const HelpMenuDark = NestedMenuSelected("app-menu-help", "dark");
export const HelpMenuDarkChinese = NestedMenuSelected("app-menu-help", "dark");
export const HelpMenuDarkJapanese = NestedMenuSelected("app-menu-help", "dark");

export const FileMenuLight = NestedMenuSelected("app-menu-file", "light");
export const FileMenuLightChinese = NestedMenuSelected("app-menu-file", "light", "zn");
export const FileMenuLightJapanese = NestedMenuSelected("app-menu-file", "light", "ja");

export const ViewMenuLight = NestedMenuSelected("app-menu-view", "light");
export const ViewMenuLightChinese = NestedMenuSelected("app-menu-view", "light", "zn");
export const ViewMenuLightJapanese = NestedMenuSelected("app-menu-view", "light", "ja");

export const HelpMenuLight = NestedMenuSelected("app-menu-help", "light");
export const HelpMenuLightChinese = NestedMenuSelected("app-menu-help", "light");
export const HelpMenuLightJapanese = NestedMenuSelected("app-menu-help", "light");
