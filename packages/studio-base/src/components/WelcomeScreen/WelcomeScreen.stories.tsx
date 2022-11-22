// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import PlayerSelectionContext, {
  PlayerSelection,
} from "@foxglove/studio-base/context/PlayerSelectionContext";

import WelcomeScreen from "./WelcomeScreen";

export default {
  colorScheme: "light",
  title: "components/WelcomeScreen",
  component: WelcomeScreen,
};

// Connection
const playerSelection: PlayerSelection = {
  selectSource: () => {},
  selectRecent: () => {},
  recentSources: [
    {
      id: "1111",
      title: "NuScenes-v1.0-mini-scene-0655-reallllllllly-long-name-8829908290831091.bag",
    },
    {
      id: "2222",
      title: "NuScenes-v1.0-mini-scene-0656.bag",
    },
    {
      id: "3333",
      title: "ws://localhost:9090/",
      label: "Rosbridge (ROS 1 & 2)",
    },
  ],
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
  ],
};

// Start

export const StartLight = (): JSX.Element => (
  <PlayerSelectionContext.Provider value={playerSelection}>
    <WelcomeScreen />
  </PlayerSelectionContext.Provider>
);

StartLight.parameters = {
  colorScheme: "light",
  title: "components/WelcomeScreen/Start/Light",
};

export const StartDark = (): JSX.Element => (
  <PlayerSelectionContext.Provider value={playerSelection}>
    <WelcomeScreen />
  </PlayerSelectionContext.Provider>
);

StartDark.parameters = {
  colorScheme: "dark",
  title: "components/WelcomeScreen/Start/Dark",
};

// Remote

export const RemoteLight = (): JSX.Element => <WelcomeScreen activeView="remote" />;

RemoteLight.parameters = {
  colorScheme: "light",
  title: "components/WelcomeScreen/Remote/Light",
};

export const RemoteDark = (): JSX.Element => <WelcomeScreen activeView="remote" />;

RemoteDark.parameters = {
  colorScheme: "dark",
  title: "components/WelcomeScreen/Remote/Dark",
};

export const ConnectionLight = (): JSX.Element => (
  <PlayerSelectionContext.Provider value={playerSelection}>
    <WelcomeScreen activeView="connection" />
  </PlayerSelectionContext.Provider>
);

ConnectionLight.parameters = {
  colorScheme: "light",
  title: "components/WelcomeScreen/Connection/Light",
};

export const ConnectionDark = (): JSX.Element => (
  <PlayerSelectionContext.Provider value={playerSelection}>
    <WelcomeScreen activeView="connection" />
  </PlayerSelectionContext.Provider>
);

ConnectionDark.parameters = {
  colorScheme: "dark",
  title: "components/WelcomeScreen/Connection/Dark",
};
