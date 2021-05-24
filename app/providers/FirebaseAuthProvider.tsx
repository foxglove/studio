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
import useShallowMemo from "@foxglove/studio-base/hooks/useShallowMemo";

const log = Log.getLogger(__filename);

export default function FirebaseAuthProvider({
  children,
}: React.PropsWithChildren<unknown>): JSX.Element {
  const app = useFirebase();

  const [user, setUser] = useState<User | undefined>();
  const { addToast } = useToasts();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(app), (newUser) => {
      setUser(newUser ?? undefined);
    });
    return unsubscribe;
  }, [app]);

  const loginWithGoogle = useCallback(async () => {
    try {
      const google = new GoogleAuthProvider(); // FIXME: safe to recreate this object on every login?
      // FIXME: login via external browser?
      const credential = await signInWithRedirect(getAuth(app), google);
      log.info("signed in:", credential);
    } catch (error) {
      addToast(`Login error: ${error.toString()}`, { appearance: "error" });
    }
  }, [addToast, app]);

  const logout = useCallback(async () => {
    try {
      await signOut(getAuth(app));
    } catch (error) {
      addToast(`Logout error: ${error.toString()}`, { appearance: "error" });
    }
  }, [addToast, app]);

  const loggedInUser = useMemo(
    () => (user != undefined ? { email: user.email ?? undefined } : undefined),
    [user],
  );

  const value = useShallowMemo({
    loggedInUser,
    loginWithGoogle,
    logout,
  });
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
