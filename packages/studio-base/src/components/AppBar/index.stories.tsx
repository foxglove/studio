// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { action } from "@storybook/addon-actions";
import { Story } from "@storybook/react";

import { AppBar } from "@foxglove/studio-base/components/AppBar";
import MockMessagePipelineProvider from "@foxglove/studio-base/components/MessagePipeline/MockMessagePipelineProvider";
import Stack from "@foxglove/studio-base/components/Stack";
import { User } from "@foxglove/studio-base/context/CurrentUserContext";
import { PlayerPresence } from "@foxglove/studio-base/players/types";

export default {
  title: "components/AppBar",
  component: AppBar,
  decorators: [Wrapper],
  parameters: {
    colorScheme: "both-column",
  },
};

const actions = {
  signIn: action("signIn"),
  onSelectDataSourceAction: action("onSelectDataSourceAction"),
  onMinimizeWindow: action("onMinimizeWindow"),
  onMaximizeWindow: action("onMaximizeWindow"),
  onUnmaximizeWindow: action("onUnmaximizeWindow"),
  onCloseWindow: action("onCloseWindow"),
};

function Wrapper(StoryFn: Story): JSX.Element {
  return (
    <MockMessagePipelineProvider>
      <StoryFn />
    </MockMessagePipelineProvider>
  );
}

export function Default(): JSX.Element {
  return (
    <AppBar
      signIn={action("signIn")}
      onSelectDataSourceAction={action("onSelectDataSourceAction")}
    />
  );
}

export function CustomWindowControls(): JSX.Element {
  return <AppBar showCustomWindowControls {...actions} />;
}

export function CustomWindowControlsMaximized(): JSX.Element {
  return <AppBar showCustomWindowControls isMaximized {...actions} />;
}

export function CustomWindowControlsDragRegion(): JSX.Element {
  return <AppBar showCustomWindowControls debugDragRegion {...actions} />;
}

export function SignInDisabled(): JSX.Element {
  return <AppBar {...actions} />;
}

export function UserPresent(): JSX.Element {
  const org: User["org"] = {
    id: "fake-orgid",
    slug: "fake-org",
    displayName: "Fake Org",
    isEnterprise: false,
    allowsUploads: false,
    supportsEdgeSites: false,
  };

  const me = {
    id: "fake-userid",
    orgId: org.id,
    orgDisplayName: org.displayName,
    orgSlug: org.slug,
    orgPaid: false,
    email: "foo@example.com",
    org,
  };

  return <AppBar currentUser={me} {...actions} />;
}

function LabeledAppBar({ label }: React.PropsWithChildren<{ label: string }>) {
  return (
    <Stack direction="row">
      <div style={{ flex: "0 0 100px" }}>{label}</div>
      <div style={{ flex: "1 0 auto" }}>
        <AppBar {...actions} />
      </div>
    </Stack>
  );
}

export function DataSources(): JSX.Element {
  return (
    <Stack overflowY="auto">
      {[
        PlayerPresence.NOT_PRESENT,
        PlayerPresence.INITIALIZING,
        PlayerPresence.RECONNECTING,
        PlayerPresence.BUFFERING,
        PlayerPresence.PRESENT,
        PlayerPresence.ERROR,
      ].map((presence) => (
        <MockMessagePipelineProvider key={presence} name="example" presence={presence}>
          <LabeledAppBar label={presence} {...actions} />
        </MockMessagePipelineProvider>
      ))}
      {[
        "foxglove-data-platform",
        "mcap-local-file",
        "ros1-local-bagfile",
        "ros2-local-bagfile",
        "ulog-local-file",
        "sample-nuscenes",
        "remote-file",
        "ros1-socket",
        "ros2-socket",
        "rosbridge-websocket",
        "foxglove-websocket",
        "velodyne-device",
        "some other source type",
      ].map((sourceId) => (
        <MockMessagePipelineProvider
          key={sourceId}
          name="example"
          presence={PlayerPresence.ERROR}
          urlState={{ sourceId }}
        >
          <LabeledAppBar label={sourceId} {...actions} />
        </MockMessagePipelineProvider>
      ))}
    </Stack>
  );
}
DataSources.parameters = { colorScheme: "light" };
