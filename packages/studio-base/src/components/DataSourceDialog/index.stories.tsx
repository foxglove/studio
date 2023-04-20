// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { StoryFn } from "@storybook/react";

import WorkspaceContextProvider from "@foxglove/studio-base/providers/WorkspaceContextProvider";

import { DataSourceDialog } from "./DataSourceDialog";

const Wrapper = (Story: StoryFn): JSX.Element => {
  return (
    <WorkspaceContextProvider
      initialState={{
        dataSourceDialog: {
          activeDataSource: undefined,
          item: "start",
          open: true,
        },
      }}
    >
      <Story />
    </WorkspaceContextProvider>
  );
};

export default {
  title: "components/DataSourceDialog",
  component: DataSourceDialog,
  decorators: [Wrapper],
};

export const DefaultLight = (): JSX.Element => <DataSourceDialog />;
DefaultLight.parameters = { colorScheme: "light" };
DefaultLight.storyName = "Default (light)";

export const DefaultDark = (): JSX.Element => <DataSourceDialog />;
DefaultDark.parameters = { colorScheme: "dark" };
DefaultDark.storyName = "Default (dark)";
