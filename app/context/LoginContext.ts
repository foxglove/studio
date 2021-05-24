// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { createContext, useContext } from "react";

export interface Login {
  loggedInUser?: {
    email?: string;
  };

  // FIXME
  //   signUp(email: string, password: string): Promise<void>;

  //   loginWithEmailAndPassword(email: string, password: string): Promise<void>;
  loginWithGoogle: () => Promise<void>;

  logout: () => Promise<void>;
}

const LoginContext = createContext<Login | undefined>(undefined);

export function useLogin(): Login {
  const ctx = useContext(LoginContext);
  if (ctx === undefined) {
    throw new Error("A LoginContext provider is required to useLogin");
  }
  return ctx;
}

export default LoginContext;
