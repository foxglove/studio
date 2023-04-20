// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { action } from "@storybook/addon-actions";
import { StoryFn } from "@storybook/react";

import { UnsavedChangesPrompt } from "@foxglove/studio-base/components/LayoutBrowser/UnsavedChangesPrompt";
import { defaultPlaybackConfig } from "@foxglove/studio-base/providers/CurrentLayoutProvider/reducers";
import { Layout, LayoutID, ISO8601Timestamp } from "@foxglove/studio-base/services/ILayoutStorage";

export default {
  title: "components/LayoutBrowser/UnsavedChangesPrompt",
  component: UnsavedChangesPrompt,
  parameters: { colorScheme: "dark" },
};

const dummyLayout: Layout = {
  id: "dummy-id" as LayoutID,
  name: "Example layout",
  permission: "ORG_WRITE",
  baseline: {
    savedAt: new Date(10).toISOString() as ISO8601Timestamp,
    data: {
      configById: {},
      globalVariables: {},
      userNodes: {},
      playbackConfig: defaultPlaybackConfig,
    },
  },
  working: undefined,
  syncInfo: undefined,
};

export const Default: StoryFn = (): JSX.Element => {
  return <UnsavedChangesPrompt isOnline layout={dummyLayout} onComplete={action("onComplete")} />;
};
export const DefaultLight = Object.assign(Default.bind(undefined), {
  parameters: { colorScheme: "light" },
});

export const Offline: StoryFn = (): JSX.Element => {
  return (
    <UnsavedChangesPrompt isOnline={false} layout={dummyLayout} onComplete={action("onComplete")} />
  );
};

export const Overwrite: StoryFn = (): JSX.Element => {
  return (
    <UnsavedChangesPrompt
      isOnline
      layout={dummyLayout}
      onComplete={action("onComplete")}
      defaultSelectedKey="overwrite"
    />
  );
};

export const MakePersonal: StoryFn = (): JSX.Element => {
  return (
    <UnsavedChangesPrompt
      isOnline
      layout={dummyLayout}
      onComplete={action("onComplete")}
      defaultSelectedKey="makePersonal"
    />
  );
};

export const MakePersonalWithEmptyField: StoryFn = (): JSX.Element => {
  return (
    <UnsavedChangesPrompt
      isOnline
      layout={dummyLayout}
      onComplete={action("onComplete")}
      defaultSelectedKey="makePersonal"
      defaultPersonalCopyName=""
    />
  );
};
