// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Story } from "@storybook/react";

import PlayerSelectionContext, {
  PlayerSelection,
} from "@foxglove/studio-base/context/PlayerSelectionContext";
import WorkspaceContextProvider from "@foxglove/studio-base/providers/WorkspaceContextProvider";

import { DataSourceDialog } from "./DataSourceDialog";

const Wrapper = (StoryFn: Story): JSX.Element => {
  return (
    <WorkspaceContextProvider
      initialState={{
        dataSourceDialog: {
          activeDataSource: undefined,
          item: "connection",
          open: true,
        },
      }}
    >
      <PlayerSelectionContext.Provider value={playerSelection}>
        <StoryFn />
      </PlayerSelectionContext.Provider>
    </WorkspaceContextProvider>
  );
};

export default {
  title: "components/DataSourceDialog/Connection",
  component: DataSourceDialog,
  decorators: [Wrapper],
};

// Connection
const playerSelection: PlayerSelection = {
  selectSource: () => {},
  selectRecent: () => {},
  recentSources: [],
  availableSources: [
    {
      id: "foo",
      type: "connection",
      displayName: "My Data Source",
      description: "Data source description",
      iconName: "ROS",
      warning: "This is a warning",

      formConfig: {
        fields: [{ id: "key", label: "Some Label" }],
      },

      initialize: () => {
        return undefined;
      },
    },
    {
      id: "bar",
      type: "connection",
      displayName: "Another data source",
      description: "Another description (with default icon)",

      initialize: () => {
        return undefined;
      },
    },
    {
      id: "bar",
      type: "connection",
      displayName: "Another data source",
      description: "Another description (with default icon)",
      iconName: "GenericScan",

      initialize: () => {
        return undefined;
      },
    },
  ],
};

export const Light = (): JSX.Element => <DataSourceDialog backdropAnimation={false} />;

Light.storyName = "Default (light)";
Light.parameters = { colorScheme: "light" };

export const LightChinese = (): JSX.Element => <Light />;

LightChinese.storyName = "Default Chinese";
LightChinese.parameters = { forceLanguage: "zh", colorScheme: "light" };

export const Dark = (): JSX.Element => <DataSourceDialog backdropAnimation={false} />;
Dark.storyName = "Default (dark)";
Dark.parameters = { colorScheme: "dark" };
