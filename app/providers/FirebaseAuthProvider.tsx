// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  User,
  getAuth,
  onAuthStateChanged,
  signOut,
  signInWithCredential,
  GoogleAuthProvider,
  OAuthCredential,
} from "@firebase/auth";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useToasts } from "react-toast-notifications";

import Log from "@foxglove/log";
import AuthContext, { Auth, CurrentUser } from "@foxglove/studio-base/context/AuthContext";
import { useFirebase } from "@foxglove/studio-base/context/FirebaseAppContext";
import useShallowMemo from "@foxglove/studio-base/hooks/useShallowMemo";

const log = Log.getLogger(__filename);

export default function FirebaseAuthProvider({
  children,
  login,
}: React.PropsWithChildren<{ login: () => Promise<string> }>): JSX.Element {
  const app = useFirebase();

  const [user, setUser] = useState<User | undefined>();
  const { addToast } = useToasts();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      getAuth(app),
      (newUser) => {
        setUser(newUser ?? undefined);
      },
      (err) => {
        addToast(`Authentication failed: ${err.toString()}`, { appearance: "error" });
        console.error("Auth error", err);
      },
    );
    return unsubscribe;
  }, [addToast, app]);

  const loginWithGoogle = useCallback(async () => {
    try {
      const params = new URLSearchParams(await login());
      const credentialStr = params.get("google");
      if (credentialStr == undefined) {
        addToast(`Login failed: no data was returned from the browser.`, { appearance: "error" });
        return;
      }
      const oauthCredential = OAuthCredential.fromJSON(credentialStr);
      if (!oauthCredential) {
        addToast(`Login failed: invalid data was returned from the browser.`, {
          appearance: "error",
        });
        return;
      }
      const credential = await signInWithCredential(getAuth(app), oauthCredential);
      log.info("signed in:", credential);
    } catch (error) {
      addToast(`Login error: ${error.toString()}`, { appearance: "error" });
    }
  }, [addToast, app, login]);

  const logout = useCallback(async () => {
    try {
      await signOut(getAuth(app));
    } catch (error) {
      addToast(`Logout error: ${error.toString()}`, { appearance: "error" });
    }
  }, [addToast, app]);

  const currentUser = useMemo<CurrentUser | undefined>(() => {
    if (user == undefined) {
      return undefined;
    }
    return {
      email: user.email ?? undefined,
      addUserToWorkspace: async () => {},
      removeUserFromWorkspace: async () => {},
      getWorkspaceMembers: async () => [],
      logout,
    };
  }, [logout, user]);

  const value = useShallowMemo<Auth>({
    currentUser,
    loginWithGoogle,
  });
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
