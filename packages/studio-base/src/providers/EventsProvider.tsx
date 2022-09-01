// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { ReactNode, useState } from "react";
import { AsyncState } from "react-use/lib/useAsyncFn";
import { createSelector } from "reselect";
import { DeepReadonly } from "ts-essentials";
import { createStore } from "zustand";

import {
  EventsContext,
  EventsStore,
  TimelinePositionedEvent,
} from "@foxglove/studio-base/context/EventsContext";

const NO_EVENTS: TimelinePositionedEvent[] = [];

export default function EventsProvider({ children }: { children?: ReactNode }): JSX.Element {
  const [store] = useState(
    createStore<EventsStore>((set) => ({
      filter: "",
      events: { loading: false, value: NO_EVENTS },
      selectedEventId: undefined,
      selectEvent: (id: undefined | string) => set({ selectedEventId: id }),
      setEvents: (events: AsyncState<TimelinePositionedEvent[]>) => set({ events }),
      setFilter: (filter: string) => set({ filter }),
    })),
  );

  return <EventsContext.Provider value={store}>{children}</EventsContext.Provider>;
}

const selectFilteredEvents = createSelector(
  (store: EventsStore) => store.events.value,
  (store: EventsStore) => store.filter,
  (events: undefined | DeepReadonly<TimelinePositionedEvent[]>, filter: string) => {
    if (!events) {
      return NO_EVENTS;
    }

    if (filter.length === 0) {
      return events;
    }

    const lowFilter = filter.toLowerCase();

    return events.filter((event) =>
      Object.entries(event.event.metadata).some(
        ([key, value]) =>
          key.toLowerCase().includes(lowFilter) || value.toLowerCase().includes(lowFilter),
      ),
    );
  },
);

export const EventsSelectors = {
  selectFilteredEvents,
};
