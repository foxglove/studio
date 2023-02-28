// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { action } from "@storybook/addon-actions";
import { Story } from "@storybook/react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import { AppBar } from "@foxglove/studio-base/components/AppBar";
import MockMessagePipelineProvider from "@foxglove/studio-base/components/MessagePipeline/MockMessagePipelineProvider";
import Panel from "@foxglove/studio-base/components/Panel";
import Stack from "@foxglove/studio-base/components/Stack";
import { User } from "@foxglove/studio-base/context/CurrentUserContext";
import PanelCatalogContext, {
  PanelCatalog,
  PanelInfo,
} from "@foxglove/studio-base/context/PanelCatalogContext";
import { PlayerPresence } from "@foxglove/studio-base/players/types";
import MockCurrentLayoutProvider from "@foxglove/studio-base/providers/CurrentLayoutProvider/MockCurrentLayoutProvider";

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

const SamplePanel1 = function () {
  return <div></div>;
};
SamplePanel1.panelType = "sample";
SamplePanel1.defaultConfig = {};

const SamplePanel2 = function () {
  return <div></div>;
};
SamplePanel2.panelType = "sample2";
SamplePanel2.defaultConfig = {};

const MockPanel1 = Panel(SamplePanel1);
const MockPanel2 = Panel(SamplePanel2);

const allPanels: PanelInfo[] = [
  { title: "Regular Panel BBB", type: "Sample1", module: async () => ({ default: MockPanel1 }) },
  { title: "Regular Panel AAA", type: "Sample2", module: async () => ({ default: MockPanel2 }) },

  {
    title: "Preconfigured Panel AAA",
    type: "Sample1",
    description: "Panel description",
    module: async () => ({ default: MockPanel1 }),
    config: { text: "def" },
  },
  {
    title: "Preconfigured Panel BBB",
    type: "Sample2",
    module: async () => ({ default: MockPanel1 }),
    config: { num: 456 },
  },
];

class MockPanelCatalog implements PanelCatalog {
  public getPanels(): readonly PanelInfo[] {
    return allPanels;
  }
  public getPanelByType(type: string): PanelInfo | undefined {
    return allPanels.find((panel) => !panel.config && panel.type === type);
  }
}

function Wrapper(StoryFn: Story): JSX.Element {
  return (
    <DndProvider backend={HTML5Backend}>
      <PanelCatalogContext.Provider value={new MockPanelCatalog()}>
        <MockCurrentLayoutProvider>
          <MockMessagePipelineProvider>
            <StoryFn />
          </MockMessagePipelineProvider>
        </MockCurrentLayoutProvider>
      </PanelCatalogContext.Provider>
    </DndProvider>
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
  return <AppBar disableSignIn {...actions} />;
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
    <>
      <div style={{ padding: 8 }}>{label}</div>
      <div>
        <AppBar {...actions} />
      </div>
    </>
  );
}

export function PlayerStates(): JSX.Element {
  return (
    <Stack overflowY="auto">
      <div
        style={{ display: "grid", gridTemplateColumns: "max-content auto", alignItems: "center" }}
      >
        {[
          PlayerPresence.NOT_PRESENT,
          PlayerPresence.INITIALIZING,
          PlayerPresence.RECONNECTING,
          PlayerPresence.BUFFERING,
          PlayerPresence.PRESENT,
          PlayerPresence.ERROR,
        ].map((presence) => (
          <MockMessagePipelineProvider
            key={presence}
            name="https://exampleurl:2002"
            presence={presence}
            problems={
              presence === PlayerPresence.ERROR
                ? [
                    { severity: "error", message: "example error" },
                    { severity: "warn", message: "example warn" },
                  ]
                : undefined
            }
          >
            <LabeledAppBar label={presence} {...actions} />
          </MockMessagePipelineProvider>
        ))}
        <MockMessagePipelineProvider
          name="https://exampleurl:2002"
          presence={PlayerPresence.INITIALIZING}
          problems={[
            { severity: "error", message: "example error" },
            { severity: "warn", message: "example warn" },
          ]}
        >
          <LabeledAppBar label="INITIALIZING + problems" {...actions} />
        </MockMessagePipelineProvider>
      </div>
    </Stack>
  );
}
PlayerStates.parameters = { colorScheme: "light" };

export function DataSources(): JSX.Element {
  return (
    <Stack overflowY="auto">
      <div
        style={{ display: "grid", gridTemplateColumns: "max-content auto", alignItems: "center" }}
      >
        <MockMessagePipelineProvider
          name="roman-transbot (dev_W m1gvryKJmREqnVT)"
          presence={PlayerPresence.PRESENT}
          urlState={{ sourceId: "foxglove-data-platform" }}
        >
          <LabeledAppBar label="foxglove-data-platform" {...actions} />
        </MockMessagePipelineProvider>
        <MockMessagePipelineProvider
          name="Adapted from nuScenes dataset. Copyright © 2020 nuScenes. https://www.nuscenes.org/terms-of-use"
          presence={PlayerPresence.PRESENT}
          urlState={{ sourceId: "sample-nuscenes" }}
        >
          <LabeledAppBar label="sample-nuscenes" {...actions} />
        </MockMessagePipelineProvider>
        {[
          "mcap-local-file",
          "ros1-local-bagfile",
          "ros2-local-bagfile",
          "ulog-local-file",
          "remote-file",
        ].map((sourceId) => (
          <MockMessagePipelineProvider
            key={sourceId}
            name="longexampleurlwith_specialcharaters-and-portnumber.ext"
            presence={PlayerPresence.PRESENT}
            urlState={{ sourceId }}
          >
            <LabeledAppBar label={sourceId} {...actions} />
          </MockMessagePipelineProvider>
        ))}
        {[
          "ros1-socket",
          "ros2-socket",
          "rosbridge-websocket",
          "foxglove-websocket",
          "velodyne-device",
          "some other source type",
        ].map((sourceId) => (
          <MockMessagePipelineProvider
            key={sourceId}
            name="https://longexampleurlwith_specialcharaters-and-portnumber:3030"
            presence={PlayerPresence.PRESENT}
            urlState={{ sourceId }}
          >
            <LabeledAppBar label={sourceId} {...actions} />
          </MockMessagePipelineProvider>
        ))}
        <MockMessagePipelineProvider
          name="https://longexampleurlwith_error-and-portnumber:3030"
          presence={PlayerPresence.PRESENT}
          problems={[
            { severity: "error", message: "example error" },
            { severity: "warn", message: "example warn" },
          ]}
        >
          <LabeledAppBar label="with problems" {...actions} />
        </MockMessagePipelineProvider>
      </div>
    </Stack>
  );
}
DataSources.parameters = { colorScheme: "light" };
