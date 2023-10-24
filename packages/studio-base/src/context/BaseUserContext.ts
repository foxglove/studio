// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { createContext, useContext } from "react";

export type UserType =
  | "unauthenticated"
  | "authenticated-free"
  | "authenticated-team"
  | "authenticated-enterprise";

export type BaseProfile = {
  email: string;
  avatarImageUrl: string | null; // eslint-disable-line no-restricted-syntax
};

export interface CurrentUser {
  currentUser: BaseProfile | undefined;
  currentUserType: UserType;
  signIn?: () => void;
  signOut?: () => Promise<void>;
}

const BaseUserContext = createContext<CurrentUser>({
  currentUser: undefined,
  currentUserType: "unauthenticated",
});
BaseUserContext.displayName = "BaseUserContext";

export function useCurrentUser(): CurrentUser {
  return useContext(BaseUserContext);
}

export default BaseUserContext;
