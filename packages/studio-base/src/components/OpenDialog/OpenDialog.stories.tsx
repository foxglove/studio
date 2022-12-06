// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { ReactNode } from "react";

import CurrentUserContext, {
  CurrentUser,
  User,
} from "@foxglove/studio-base/context/CurrentUserContext";
import PlayerSelectionContext, {
  PlayerSelection,
} from "@foxglove/studio-base/context/PlayerSelectionContext";

import OpenDialog from "./OpenDialog";

export default {
  colorScheme: "light",
  title: "components/OpenDialog",
  component: OpenDialog,
};

function fakeUser(type: "free" | "paid" | "enterprise"): User {
  return {
    id: "user-1",
    email: "user@example.com",
    orgId: "org_id",
    orgDisplayName: "Orgalorg",
    orgSlug: "org",
    orgPaid: type === "paid" || type === "enterprise",
    org: {
      id: "org_id",
      slug: "org",
      displayName: "Orgalorg",
      isEnterprise: type === "enterprise",
      hasStripeSubscription: type === "paid" || type === "enterprise",
      allowsUploads: true,
      supportsEdgeSites: type === "enterprise",
    },
  };
}

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

function CurrentUserWrapper(props: { children: ReactNode; user?: User }): JSX.Element {
  const value: CurrentUser = {
    currentUser: props.user,
    signIn: () => undefined,
    signOut: async () => undefined,
  };
  return <CurrentUserContext.Provider value={value}>{props.children}</CurrentUserContext.Provider>;
}

// Start

export const StartLight = (): JSX.Element => (
  <PlayerSelectionContext.Provider value={playerSelection}>
    <OpenDialog />
  </PlayerSelectionContext.Provider>
);

StartLight.parameters = {
  colorScheme: "light",
  title: "components/OpenDialog/Start/Light",
};

export const StartDark = (): JSX.Element => (
  <PlayerSelectionContext.Provider value={playerSelection}>
    <OpenDialog />
  </PlayerSelectionContext.Provider>
);

StartDark.parameters = {
  colorScheme: "dark",
  title: "components/OpenDialog/Start/Dark",
};

export const ConnectionLight = (): JSX.Element => (
  <PlayerSelectionContext.Provider value={playerSelection}>
    <OpenDialog activeView="connection" />
  </PlayerSelectionContext.Provider>
);

ConnectionLight.parameters = {
  colorScheme: "light",
  title: "components/OpenDialog/Connection/Light",
};

export const ConnectionDark = (): JSX.Element => (
  <PlayerSelectionContext.Provider value={playerSelection}>
    <OpenDialog activeView="connection" />
  </PlayerSelectionContext.Provider>
);

ConnectionDark.parameters = {
  colorScheme: "dark",
  title: "components/OpenDialog/Connection/Dark",
};

export function StartWithNoUser(): JSX.Element {
  return (
    <PlayerSelectionContext.Provider value={playerSelection}>
      <OpenDialog />
    </PlayerSelectionContext.Provider>
  );
}

export function StartWithFreeUser(): JSX.Element {
  const freeUser = fakeUser("free");

  return (
    <CurrentUserWrapper user={freeUser}>
      <PlayerSelectionContext.Provider value={playerSelection}>
        <OpenDialog />
      </PlayerSelectionContext.Provider>
    </CurrentUserWrapper>
  );
}

export function StartWithPaidUser(): JSX.Element {
  const freeUser = fakeUser("paid");

  return (
    <CurrentUserWrapper user={freeUser}>
      <PlayerSelectionContext.Provider value={playerSelection}>
        <OpenDialog />
      </PlayerSelectionContext.Provider>
    </CurrentUserWrapper>
  );
}

export function StartWithEnterpriseUser(): JSX.Element {
  const freeUser = fakeUser("enterprise");

  return (
    <CurrentUserWrapper user={freeUser}>
      <PlayerSelectionContext.Provider value={playerSelection}>
        <OpenDialog />
      </PlayerSelectionContext.Provider>
    </CurrentUserWrapper>
  );
}
