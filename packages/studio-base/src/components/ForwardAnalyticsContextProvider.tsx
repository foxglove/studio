// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useContext, useEffect, useLayoutEffect, useState } from "react";
import { StoreApi, createStore, useStore } from "zustand";

import { useMustNotChange } from "@foxglove/hooks";
import AnalyticsContext from "@foxglove/studio-base/context/AnalyticsContext";
import IAnalytics from "@foxglove/studio-base/services/IAnalytics";

export type ForwardedAnalytics = StoreApi<{ value: IAnalytics }>;

/**
 * Returns a Map entry for forwarding the given context's value, which can be passed to
 * `ForwardContextProviders`.
 */
export function useForwardedAnalytics(): ForwardedAnalytics {
  const value = useContext(AnalyticsContext);
  const [store] = useState(() => createStore(() => ({ value })));
  useLayoutEffect(() => {
    store.setState({ value });
  }, [store, value]);
  return store;
}

/**
 * Forwards React context values between separate React trees. This is used for exposing Studio
 * internal contexts (such as analytics) to internal extension panels, which are in their own React
 * trees and otherwise can't access context values from the rest of Studio.
 *
 * This component should be rendered in the destination tree, with the `contexts` prop constructed
 * from `useForwardContext()` hooks rendered in the source tree.
 */
export function ForwardAnalyticsContextProvider({
  /** Context to forward. Should be the return value from useForwardedAnalytics in the outer tree. */
  forwardedAnalytics,
  children,
}: React.PropsWithChildren<{ forwardedAnalytics: ForwardedAnalytics }>): JSX.Element {
  useMustNotChange(forwardedAnalytics);
  const [store] = useState(() =>
    createStore<IAnalytics>(() => forwardedAnalytics.getState().value),
  );
  useEffect(() => {
    const unsubscribe = forwardedAnalytics.subscribe(() =>
      store.setState(forwardedAnalytics.getState().value),
    );
    return unsubscribe;
  }, [forwardedAnalytics, store]);
  const value = useStore(store);
  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
}
