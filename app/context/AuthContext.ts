// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { createContext, useContext } from "react";

export interface CurrentAccount {
  email?: string;

  // FIXME: bikeshed naming
  addUserToWorkspace: (email: string) => Promise<void>;
  removeUserFromWorkspace: (email: string) => Promise<void>;

  getWorkspaceMembers: () => Promise<{ email: string }[]>;

  logout: () => Promise<void>;
}

export interface Auth {
  currentAccount?: CurrentAccount;

  loginWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<Auth | undefined>(undefined);

export function useAuth(): Auth {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("A LoginContext provider is required to useLogin");
  }
  return ctx;
}

export default AuthContext;
