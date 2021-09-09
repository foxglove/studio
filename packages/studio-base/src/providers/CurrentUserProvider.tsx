// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { PropsWithChildren, useEffect, useRef, useState } from "react";
import { useAsync, useLocalStorage } from "react-use";

import Logger from "@foxglove/log";
import { useShallowMemo } from "@foxglove/studio-base/../../hooks/src";
import { useConsoleApi } from "@foxglove/studio-base/context/ConsoleApiContext";
import CurrentUserContext from "@foxglove/studio-base/context/CurrentUserContext";

const log = Logger.getLogger(__filename);

/**
 * CurrentUserProvider attempts to load the current user's profile if there is an authenticated
 * session
 */
export default function CurrentUserProvider(props: PropsWithChildren<unknown>): JSX.Element {
  const api = useConsoleApi();
  const [bearerToken, setBearerToken] = useLocalStorage<string>("fox.bearer-token");
  const [completedFirstLoad, setCompletedFirstLoad] = useState(false);

  const { value: currentUser } = useAsync(async () => {
    try {
      if (!bearerToken) {
        return undefined;
      }
      api.setAuthHeader(`Bearer ${bearerToken}`);
      return await api.me();
    } catch (error) {
      log.error(error);
      return undefined;
    } finally {
      setCompletedFirstLoad(true);
    }
  }, [api, bearerToken]);

  const value = useShallowMemo({ currentUser, setBearerToken });

  if (!completedFirstLoad) {
    return <></>;
  }

  return <CurrentUserContext.Provider value={value}>{props.children}</CurrentUserContext.Provider>;
}
