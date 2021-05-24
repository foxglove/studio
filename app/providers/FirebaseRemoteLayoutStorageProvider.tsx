// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  User,
  getAuth,
  onAuthStateChanged,
  signOut,
  signInWithRedirect,
  GoogleAuthProvider,
} from "@firebase/auth";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useToasts } from "react-toast-notifications";

import Log from "@foxglove/log";
import AuthContext from "@foxglove/studio-base/context/AuthContext";
import { useFirebase } from "@foxglove/studio-base/context/FirebaseAppContext";
import RemoteLayoutStorageContext, {
  RemoteLayoutStorage,
} from "@foxglove/studio-base/context/RemoteLayoutStorageContext";
import useShallowMemo from "@foxglove/studio-base/hooks/useShallowMemo";

const log = Log.getLogger(__filename);

export default function FirebaseRemoteLayoutStorageProvider({
  children,
}: React.PropsWithChildren<unknown>): JSX.Element {
  // const app = useFirebase();

  const value: RemoteLayoutStorage = useMemo(
    () => ({
      getCurrentUserLayouts: async () => [],
      getSharedLayouts: async () => [],
      getLayoutHistory: async () => [],

      putCurrentUserLayout: async () => {},
      putSharedLayout: async () => {},
    }),
    [],
  );
  return (
    <RemoteLayoutStorageContext.Provider value={value}>
      {children}
    </RemoteLayoutStorageContext.Provider>
  );
}
