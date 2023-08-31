// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Meta, StoryObj } from "@storybook/react";
import { noop } from "lodash";

import { AppBarMenuItem } from "@foxglove/studio-base/components/AppBar/types";
import { AppContext } from "@foxglove/studio-base/context/AppContext";
import PlayerSelectionContext, {
  PlayerSelection,
} from "@foxglove/studio-base/context/PlayerSelectionContext";
import MockCurrentLayoutProvider from "@foxglove/studio-base/providers/CurrentLayoutProvider/MockCurrentLayoutProvider";
import WorkspaceContextProvider from "@foxglove/studio-base/providers/WorkspaceContextProvider";

import { AppMenu, AppMenuProps } from "./AppMenu";

type StoryArgs = {
  appBarMenuItems?: AppBarMenuItem[];
} & AppMenuProps;

type Story = StoryObj<StoryArgs>;

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

export default {
  title: "beta/components/AppMenu",
  component: AppMenu,
  args: {
    open: true,
    anchorPosition: { top: 0, left: 0 },
    anchorReference: "anchorPosition",
    disablePortal: true,
    onClose: noop,
  },
  decorators: [
    (Story, { args: { appBarMenuItems, ...args } }): JSX.Element => (
      <AppContext.Provider value={{ appBarMenuItems }}>
        <MockCurrentLayoutProvider>
          <WorkspaceContextProvider>
            <PlayerSelectionContext.Provider value={playerSelection}>
              <Story {...args} />
            </PlayerSelectionContext.Provider>
          </WorkspaceContextProvider>
        </MockCurrentLayoutProvider>
      </AppContext.Provider>
    ),
  ],
} satisfies Meta<StoryArgs>;

export const Default: Story = {};

export const WithAppContextMenuItens: Story = {
  args: {
    appBarMenuItems: [
      { type: "subheader", key: "browse", label: "Browse data", external: true },
      { type: "item", key: "devices", label: "Devices", external: true },
      { type: "item", key: "recordings", label: "Recordings", external: true },
      { type: "item", key: "timeline", label: "Timeline", external: true },
    ],
  },
};
