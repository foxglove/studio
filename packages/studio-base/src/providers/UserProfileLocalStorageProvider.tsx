// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { SetStateAction, useCallback, useEffect, useMemo, useState } from "react";

import {
  UserProfile,
  UserProfileStorageContext,
} from "@foxglove/studio-base/context/UserProfileStorageContext";
import { UserProfileStorage } from "@foxglove/studio-base/context/UserProfileStorageContext";

const LOCAL_STORAGE_KEY = "studio.profile-data";

/**
 * A provider for UserProfileStorage that stores data in localStorage.
 */
export default function UserProfileLocalStorageProvider({
  children,
}: React.PropsWithChildren<unknown>): JSX.Element {
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const item = localStorage.getItem(LOCAL_STORAGE_KEY);
    const baseItem: Partial<UserProfile> = item ? JSON.parse(item) : {};
    baseItem.firstSeenTime ??= new Date().toISOString();
    baseItem.firstSeenTimeIsFirstLoad ??= baseItem.currentLayoutId == undefined;
    return baseItem as UserProfile;
  });

  const setUserProfileCallback = useCallback((setter: SetStateAction<UserProfile>) => {
    setUserProfile((oldValue) => (typeof setter === "function" ? setter(oldValue) : setter));
  }, []);

  useEffect(() => {
    const stringifiedProfile = JSON.stringify(userProfile);
    if (stringifiedProfile) {
      localStorage.setItem(LOCAL_STORAGE_KEY, stringifiedProfile);
    }
  }, [userProfile]);

  const value: UserProfileStorage = useMemo(
    () => [userProfile, setUserProfileCallback],
    [userProfile, setUserProfileCallback],
  );

  return (
    <UserProfileStorageContext.Provider value={value}>
      {children}
    </UserProfileStorageContext.Provider>
  );
}
