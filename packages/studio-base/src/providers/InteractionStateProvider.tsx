// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { isEqual } from "lodash";
import { ReactNode, useState } from "react";
import { createStore, StoreApi } from "zustand";

import {
  InteractionStateContext,
  IteractionStateStore,
} from "@foxglove/studio-base/context/InteractionStateContext";
import { HoverValue } from "@foxglove/studio-base/types/hoverValue";

function createInteractionStateStore(): StoreApi<IteractionStateStore> {
  return createStore((set) => {
    return {
      hoverValue: undefined,
      clearHoverValue: (componentId: string) =>
        set((store) => ({
          hoverValue: store.hoverValue?.componentId === componentId ? undefined : store.hoverValue,
        })),
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
