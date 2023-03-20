// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { ReactNode, useState } from "react";
import { createStore, StoreApi } from "zustand";
import { persist } from "zustand/middleware";

import {
  WorkspaceContext,
  WorkspaceContextStore,
} from "@foxglove/studio-base/context/WorkspaceContext";

function createWorkspaceContextStore(): StoreApi<WorkspaceContextStore> {
  return createStore<WorkspaceContextStore>()(
    persist(
      () => {
        const store: WorkspaceContextStore = {
          layoutMenuOpen: false,
          leftSidebarItem: undefined,
          leftSidebarOpen: false,
          leftSidebarSize: undefined,
          rightSidebarItem: undefined,
          rightSidebarOpen: false,
          rightSidebarSize: undefined,
          sidebarItem: undefined,
        };
        return store;
      },
      {
        name: "fox.workspace",
        partialize: (value) => {
          const { layoutMenuOpen: _, ...rest } = value;
          return rest;
        },
      },
    ),
  );
}

export default function WorkspaceContextProvider({
  children,
}: {
  children?: ReactNode;
}): JSX.Element {
  const [store] = useState(createWorkspaceContextStore());

  return <WorkspaceContext.Provider value={store}>{children}</WorkspaceContext.Provider>;
}
