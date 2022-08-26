// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { isEqual } from "lodash";
import { ReactNode, useState } from "react";
import { AsyncState } from "react-use/lib/useAsyncFn";
import { createStore, StoreApi } from "zustand";

import {
  InteractionStateContext,
  InteractionStateStore,
  SyncBounds,
} from "@foxglove/studio-base/context/InteractionStateContext";
import { DataEvent } from "@foxglove/studio-base/types/DataEvent";
import { HoverValue } from "@foxglove/studio-base/types/hoverValue";

function createInteractionStateStore(): StoreApi<InteractionStateStore> {
  return createStore((set, get) => {
    return {
      events: { loading: false, value: [] },
      globalBounds: undefined,
      hoverValue: undefined,
      selectedEventId: undefined,
      syncBounds: undefined,

      clearHoverValue: (componentId: string) =>
        set((store) => ({
          hoverValue: store.hoverValue?.componentId === componentId ? undefined : store.hoverValue,
        })),

      selectEvent: (selectedEventId: undefined | string) => set({ selectedEventId }),

      setEvents: (events: AsyncState<DataEvent[]>) => set({ events, selectedEventId: undefined }),

      setGlobalBounds: (
        newBounds:
          | undefined
          | SyncBounds
          | ((oldValue: undefined | SyncBounds) => undefined | SyncBounds),
      ) => {
        if (typeof newBounds === "function") {
          set({ globalBounds: newBounds(get().globalBounds) });
        } else {
          set({ globalBounds: newBounds });
        }
      },

      setHoverValue: (newValue: HoverValue) =>
        set((store) => ({
          hoverValue: isEqual(newValue, store.hoverValue) ? store.hoverValue : newValue,
        })),
    };
  });
}

export function InteractionStateProvider({ children }: { children?: ReactNode }): JSX.Element {
  const [store] = useState(createInteractionStateStore());

  return (
    <InteractionStateContext.Provider value={store}>{children}</InteractionStateContext.Provider>
  );
}
