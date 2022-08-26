// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
//
// This file incorporates work covered by the following copyright and
// permission notice:
//
//   Copyright 2018-2021 Cruise LLC
//
//   This source code is licensed under the Apache License, Version 2.0,
//   found at http://www.apache.org/licenses/LICENSE-2.0
//   You may not use this file except in compliance with the License.

import { createContext, useCallback } from "react";
import { AsyncState } from "react-use/lib/useAsyncFn";
import { StoreApi, useStore } from "zustand";

import useGuaranteedContext from "@foxglove/studio-base/hooks/useGuaranteedContext";
import { DataEvent } from "@foxglove/studio-base/types/DataEvent";
import type { HoverValue } from "@foxglove/studio-base/types/hoverValue";

export type SyncBounds = { min: number; max: number; sourceId: string; userInteraction: boolean };

export type InteractionStateStore = Readonly<{
  events: AsyncState<DataEvent[]>;
  globalBounds: undefined | SyncBounds;
  hoverValue: undefined | HoverValue;
  selectedEventId: undefined | string;

  clearHoverValue: (componentId: string) => void;
  selectEvent: (id: undefined | string) => void;
  setEvents: (events: AsyncState<DataEvent[]>) => void;
  setGlobalBounds: (
    newBounds:
      | undefined
      | SyncBounds
      | ((oldValue: undefined | SyncBounds) => undefined | SyncBounds),
  ) => void;
  setHoverValue: (value: HoverValue) => void;
}>;

export const InteractionStateContext = createContext<undefined | StoreApi<InteractionStateStore>>(
  undefined,
);

export function useInteractionState<T>(
  selector: (store: InteractionStateStore) => T,
  equalityFn?: (a: T, b: T) => boolean,
): T {
  const context = useGuaranteedContext(InteractionStateContext);
  return useStore(context, selector, equalityFn);
}

const selectClearHoverValue = (store: InteractionStateStore) => store.clearHoverValue;

export function useClearHoverValue(): InteractionStateStore["clearHoverValue"] {
  return useInteractionState(selectClearHoverValue);
}

const selectSetHoverValue = (store: InteractionStateStore) => store.setHoverValue;

export function useSetHoverValue(): InteractionStateStore["setHoverValue"] {
  return useInteractionState(selectSetHoverValue);
}

export function useHoverValue(args?: {
  componentId: string;
  isTimestampScale: boolean;
}): HoverValue | undefined {
  const hasArgs = !!args;
  const componentId = args?.componentId;
  const isTimestampScale = args?.isTimestampScale ?? false;

  const selector = useCallback(
    (store: InteractionStateStore) => {
      if (!hasArgs) {
        // Raw form -- user needs to check that the value should be shown.
        return store.hoverValue;
      }
      if (store.hoverValue == undefined) {
        return undefined;
      }
      if (store.hoverValue.type === "PLAYBACK_SECONDS" && isTimestampScale) {
        // Always show playback-time hover values for timestamp-based charts.
        return store.hoverValue;
      }
      // Otherwise just show hover bars when hovering over the panel itself.
      return store.hoverValue.componentId === componentId ? store.hoverValue : undefined;
    },
    [hasArgs, componentId, isTimestampScale],
  );

  return useInteractionState(selector);
}
