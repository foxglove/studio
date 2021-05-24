// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { DefaultButton, Stack, useTheme } from "@fluentui/react";

import { SidebarContent } from "@foxglove/studio-base/components/SidebarContent";
import { useAuth } from "@foxglove/studio-base/context/AuthContext";

export default function AccountSettings(): JSX.Element {
  const { currentAccount, loginWithGoogle } = useAuth();

  const theme = useTheme();
  let content: JSX.Element;
  if (currentAccount) {
    content = (
      <Stack tokens={{ childrenGap: theme.spacing.s1 }}>
        <div>Logged in as: {currentAccount.email ?? "(no email address)"}</div>
        <DefaultButton text="Sign out" onClick={() => currentAccount.logout()} />
      </Stack>
    );
  } else {
    content = (
      <Stack tokens={{ childrenGap: theme.spacing.s1 }}>
        <div>Log in to access collaboration features like shared layouts.</div>
        <DefaultButton text="Sign in with Google" onClick={loginWithGoogle} />
      </Stack>
    );
  }
  return <SidebarContent title="Account">{content}</SidebarContent>;
}
