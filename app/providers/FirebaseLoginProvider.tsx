// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  User,
  getAuth,
  onAuthStateChanged,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
} from "@firebase/auth";
import { useCallback, useEffect, useMemo, useState } from "react";

import Log from "@foxglove/log";
import { useFirebase } from "@foxglove/studio-base/context/FirebaseAppContext";
import LoginContext from "@foxglove/studio-base/context/LoginContext";
import useShallowMemo from "@foxglove/studio-base/hooks/useShallowMemo";

const log = Log.getLogger(__filename);

export default function FirebaseLoginProvider({
  children,
}: React.PropsWithChildren<unknown>): JSX.Element {
  const app = useFirebase();

  const [user, setUser] = useState<User | undefined>();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(app), (newUser) => {
      setUser(newUser ?? undefined);
    });
    return unsubscribe;
  }, [app]);

  const loginWithGoogle = useCallback(async () => {
    const google = new GoogleAuthProvider(); // FIXME: safe to recreate this object on every login?
    // FIXME: maybe signInWithRedirect?
    const credential = await signInWithPopup(getAuth(app), google);
    log.info("signed in:", credential);
  }, [app]);

  const logout = useCallback(async () => {
    return signOut(getAuth(app));
  }, [app]);

  const loggedInUser = useMemo(
    () => (user != undefined ? { email: user.email ?? undefined } : undefined),
    [user],
  );

  const value = useShallowMemo({
    loggedInUser,
    loginWithGoogle,
    logout,
  });
  return <LoginContext.Provider value={value}>{children}</LoginContext.Provider>;
}
