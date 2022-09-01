// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { isEqual, keyBy } from "lodash";
import { ReactNode, useState } from "react";
import { createStore, StoreApi } from "zustand";

import {
  TimelineInteractionStateContext,
  TimelineInteractionStateStore,
  SyncBounds,
} from "@foxglove/studio-base/context/TimelineInteractionStateContext";
import { ConsoleEvent } from "@foxglove/studio-base/services/ConsoleApi";
import { HoverValue } from "@foxglove/studio-base/types/hoverValue";

function createTimelineInteractionStateStore(): StoreApi<TimelineInteractionStateStore> {
  return createStore((set) => {
    return {
      globalBounds: undefined,
      hoveredEvents: {},
      hoverValue: undefined,

      clearHoverValue: (componentId: string) =>
        set((store) => ({
          hoverValue: store.hoverValue?.componentId === componentId ? undefined : store.hoverValue,
        })),

      setGlobalBounds: (
        newBounds:
          | undefined
          | SyncBounds
          | ((oldValue: undefined | SyncBounds) => undefined | SyncBounds),
      ) => {
        if (typeof newBounds === "function") {
          set((store) => ({ globalBounds: newBounds(store.globalBounds) }));
        } else {
          set({ globalBounds: newBounds });
        }
      },

      setHoveredEvents: (hoveredEvents: ConsoleEvent[]) =>
        set({ hoveredEvents: keyBy(hoveredEvents, (event) => event.id) }),

      setHoverValue: (newValue: HoverValue) =>
        set((store) => ({
          hoverValue: isEqual(newValue, store.hoverValue) ? store.hoverValue : newValue,
        })),
    };
  });
}

export default function TimelineInteractionStateProvider({
  children,
}: {
  children?: ReactNode;
}): JSX.Element {
  const [store] = useState(createTimelineInteractionStateStore());

  return (
    <TimelineInteractionStateContext.Provider value={store}>
      {children}
    </TimelineInteractionStateContext.Provider>
  );
}
