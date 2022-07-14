// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import PlayerSelectionContext, {
  PlayerSelection,
} from "@foxglove/studio-base/context/PlayerSelectionContext";

import OpenDialog from "./OpenDialog";

export default {
  colorScheme: "light",
  title: "components/OpenDialog",
  component: OpenDialog,
};

// Start

export const StartLight = (): JSX.Element => <OpenDialog />;

StartLight.parameters = {
  colorScheme: "light",
  title: "components/OpenDialog/Start/Light",
};

export const StartDark = (): JSX.Element => <OpenDialog />;

StartDark.parameters = {
  colorScheme: "dark",
  title: "components/OpenDialog/Start/Dark",
};

// Remote

export const RemoteLight = (): JSX.Element => <OpenDialog activeView="remote" />;

RemoteLight.parameters = {
  colorScheme: "light",
  title: "components/OpenDialog/Remote/Light",
};

export const RemoteDark = (): JSX.Element => <OpenDialog activeView="remote" />;

RemoteDark.parameters = {
  colorScheme: "dark",
  title: "components/OpenDialog/Remote/Dark",
};

// Connection

export const ConnectionLight = (): JSX.Element => {
  const playerSelection: PlayerSelection = {
    selectSource: () => {},
    selectRecent: () => {},
    recentSources: [],
    availableSources: [
      {
        id: "foo",
        type: "connection",
        displayName: "My Data Source",

        formConfig: {
          fields: [{ id: "key", label: "Some Label" }],
        },

        initialize: () => {
          return undefined;
        },
      },
    ],
  };

  return (
    <PlayerSelectionContext.Provider value={playerSelection}>
      <OpenDialog activeView="connection" />
    </PlayerSelectionContext.Provider>
  );
};

ConnectionLight.parameters = {
  colorScheme: "light",
  title: "components/OpenDialog/Connection/Light",
};

export const ConnectionDark = (): JSX.Element => {
  const playerSelection: PlayerSelection = {
    selectSource: () => {},
    selectRecent: () => {},
    recentSources: [],
    availableSources: [
      {
        id: "foo",
        type: "connection",
        displayName: "My Data Source",

        formConfig: {
          fields: [{ id: "key", label: "Some Label" }],
        },

        initialize: () => {
          return undefined;
        },
      },
    ],
  };

  return (
    <PlayerSelectionContext.Provider value={playerSelection}>
      <OpenDialog activeView="connection" />
    </PlayerSelectionContext.Provider>
  );
};

ConnectionDark.parameters = {
  colorScheme: "dark",
  title: "components/OpenDialog/Connection/Dark",
};
