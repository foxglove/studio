// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { createContext, useContext, useLayoutEffect } from "react";
import { useAsyncFn } from "react-use";
import { AsyncState } from "react-use/lib/useAsyncFn";

// Exposes an interface for reading and writing user-configurable options and other persistent application state.
export interface AppConfiguration {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
}

const AppConfigurationContext = createContext<AppConfiguration | undefined>(undefined);

export function useAppConfiguration(): AppConfiguration {
  const storage = useContext(AppConfigurationContext);
  if (!storage) {
    throw new Error("An AppConfigurationContext provider is required to useAppConfiguration");
  }
  return storage;
}

export function useAsyncAppConfigurationValue<T>(
  key: string,
): [state: AsyncState<T>, setter: (value: T) => Promise<void>] {
  const appConfiguration = useAppConfiguration();
  const [getterState, getter] = useAsyncFn(async () => (await appConfiguration.get(key)) as T, [
    appConfiguration,
    key,
  ]);

  // Start loading the current value on first render
  useLayoutEffect(() => {
    getter();
  }, [getter]);

  const [setterState, setter] = useAsyncFn(
    async (value: T) => {
      await appConfiguration.set(key, value);
      getter(); // re-trigger the getter so the new value is displayed
    },
    [appConfiguration, key, getter],
  );

  const state =
    setterState.loading || setterState.error ? { ...setterState, value: undefined } : getterState;
  return [state, setter];
}

export default AppConfigurationContext;
