// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { ReactNode, useState } from "react";

import { UserButton } from "@foxglove/studio-base/components/AppBar/UserButton";
import Stack from "@foxglove/studio-base/components/Stack";
import CurrentUserContext, {
  CurrentUser,
  User,
} from "@foxglove/studio-base/context/CurrentUserContext";

import { StorybookDecorator } from "./StorybookDecorator.stories";
import { UserMenu } from "./UserMenu";

export default {
  title: "components/AppBar/UserMenu",
  component: UserMenu,
  decorators: [StorybookDecorator],
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
      allowsUploads: true,
      supportsEdgeSites: type === "enterprise",
    },
  };
}

function CurrentUserWrapper(props: { children: ReactNode; user?: User | undefined }): JSX.Element {
  const value: CurrentUser = {
    currentUser: props.user,
    signIn: () => undefined,
    signOut: async () => undefined,
  };
  return <CurrentUserContext.Provider value={value}>{props.children}</CurrentUserContext.Provider>;
}

const noOp = () => {
  // no-op
};

export function Default(): JSX.Element {
  const [userAnchorEl, setUserAnchorEl] = useState<undefined | HTMLElement>(undefined);
  const userMenuOpen = Boolean(userAnchorEl);

  return (
    <Stack padding={2} alignItems="flex-start">
      <UserButton
        userMenuOpen={userMenuOpen}
        setUserAnchorEl={setUserAnchorEl}
        prefsDialogOpen={false}
        setPrefsDialogOpen={noOp}
      />
    </Stack>
  );
}

export function Private(): JSX.Element {
  const [userAnchorEl, setUserAnchorEl] = useState<undefined | HTMLElement>(undefined);
  const userMenuOpen = Boolean(userAnchorEl);

  return (
    <CurrentUserWrapper>
      <Stack padding={2} alignItems="flex-start">
        <UserButton
          userMenuOpen={userMenuOpen}
          setUserAnchorEl={setUserAnchorEl}
          prefsDialogOpen={false}
          setPrefsDialogOpen={noOp}
        />
      </Stack>
    </CurrentUserWrapper>
  );
}

export function UserPresent(): JSX.Element {
  const [userAnchorEl, setUserAnchorEl] = useState<undefined | HTMLElement>(undefined);
  const userMenuOpen = Boolean(userAnchorEl);
  const freeUser = fakeUser("free");

  return (
    <CurrentUserWrapper user={freeUser}>
      <Stack padding={2} alignItems="flex-start">
        <UserButton
          userMenuOpen={userMenuOpen}
          setUserAnchorEl={setUserAnchorEl}
          prefsDialogOpen={false}
          setPrefsDialogOpen={noOp}
        />
        <UserMenu
          open={true}
          anchorPosition={{ top: 60, left: 0 }}
          anchorReference="anchorPosition"
          disablePortal
          handleClose={noOp}
          onPreferencesClick={noOp}
        />
      </Stack>
    </CurrentUserWrapper>
  );
}
