// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useContext, useLayoutEffect, useState } from "react";
import { StoreApi, createStore, useStore } from "zustand";

import { useMustNotChange, useShallowMemo } from "@foxglove/hooks";
import MultiProvider from "@foxglove/studio-base/components/MultiProvider";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ForwardedContexts = ReadonlyMap<React.Context<any>, StoreApi<{ value: unknown }>>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ForwardedContextValues = ReadonlyMap<React.Context<any>, unknown>;

/**
 * Returns a Map entry for forwarding the given context's value, which can be passed to
 * `ForwardContextProviders`.
 */
export function useForwardContext<T>(
  context: React.Context<T>,
): readonly [React.Context<T>, StoreApi<{ value: T }>] {
  const value = useContext(context);
  const [store] = useState(() => createStore(() => ({ value })));
  useLayoutEffect(() => {
    store.setState({ value });
  }, [store, value]);
  return useShallowMemo([context, store] as const);
}

function getContextValues(contexts: ForwardedContexts): ForwardedContextValues {
  return new Map(
    Array.from(contexts.entries(), ([context, contextStore]) => [
      context,
      contextStore.getState().value,
    ]),
  );
}

/**
 * Forwards React context values between separate React trees. This is used for exposing Studio
 * internal contexts (such as analytics) to internal extension panels, which are in their own React
 * trees and otherwise can't access context values from the rest of Studio.
 */
export function ForwardContextProviders({
  /** Contexts to forward. A Map that should be built with entries from `useForwardContext()`. */
  contexts,
  children,
}: React.PropsWithChildren<{ contexts: ForwardedContexts }>): JSX.Element {
  useMustNotChange(contexts);
  const [store] = useState(() =>
    createStore<ForwardedContextValues>((set) => {
      for (const contextStore of contexts.values()) {
        contextStore.subscribe(() => set(getContextValues(contexts)));
      }
      return getContextValues(contexts);
    }),
  );
  const providers = useStore(store, (state) =>
    Array.from(state.entries(), ([context, value], idx) => (
      <context.Provider key={idx} value={value} />
    )),
  );
  return <MultiProvider providers={providers}>{children}</MultiProvider>;
}
