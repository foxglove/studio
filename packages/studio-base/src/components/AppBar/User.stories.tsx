// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Story } from "@storybook/react";

import Stack from "@foxglove/studio-base/components/Stack";
import CurrentUserContext, {
  CurrentUser,
  User,
} from "@foxglove/studio-base/context/CurrentUserContext";

import { StorybookDecorator } from "./StorybookDecorator.stories";
import { UserButton, UserMenu } from "./UserMenu";

export default {
  title: "components/AppBar/UserMenu",
  component: UserMenu,
  decorators: [UserDecorator, StorybookDecorator],
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

function UserDecorator(StoryFn: Story): JSX.Element {
  const currentUser = fakeUser("free");

  const value: CurrentUser = {
    currentUser,
    signIn: () => undefined,
    signOut: async () => undefined,
  };
  return (
    <CurrentUserContext.Provider value={value}>
      <StoryFn />
    </CurrentUserContext.Provider>
  );
}

const noOp = () => {
  // no-op
};

export function Default(): JSX.Element {
  return (
    <Stack padding={1.5} alignItems="flex-start">
      <UserButton
        userMenuOpen={false}
        setUserAnchorEl={noOp}
        prefsDialogOpen={false}
        setPrefsDialogOpen={noOp}
      />
      <UserMenu
        open
        anchorReference="anchorPosition"
        anchorPosition={{ left: 0, top: 54 }}
        disablePortal
        handleClose={noOp}
        onPreferencesClick={noOp}
      />
    </Stack>
  );
}
