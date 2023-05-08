// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { pick } from "lodash";
import { ReactNode, useState } from "react";
import { StoreApi, createStore } from "zustand";
import { persist } from "zustand/middleware";

import { AppSettingsTab } from "@foxglove/studio-base/components/AppSettingsDialog/AppSettingsDialog";
import { DataSourceDialogItem } from "@foxglove/studio-base/components/DataSourceDialog";
import { IDataSourceFactory } from "@foxglove/studio-base/context/PlayerSelectionContext";
import {
  LeftSidebarItemKey,
  RightSidebarItemKey,
  SidebarItemKey,
  WorkspaceContext,
  WorkspaceContextStore,
} from "@foxglove/studio-base/context/Workspace/WorkspaceContext";

// Type of version 0 store, used for migration.
type WorkspaceContextStoreV0 = {
  dataSourceDialog: {
    activeDataSource: undefined | IDataSourceFactory;
    item: undefined | DataSourceDialogItem;
    open: boolean;
  };
  featureTours: {
    active: undefined | string;
    shown: string[];
  };
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  leftSidebarItem: undefined | LeftSidebarItemKey;
  leftSidebarSize: undefined | number;
  rightSidebarItem: undefined | RightSidebarItemKey;
  rightSidebarSize: undefined | number;
  playbackControls: {
    repeat: boolean;
  };
  prefsDialogState: {
    initialTab: undefined | AppSettingsTab;
    open: boolean;
  };
  sidebarItem: undefined | SidebarItemKey;
};

function migrateV0State(oldState: unknown, _version: number): WorkspaceContextStore {
  // Currently v0 is the only obsolete state. If we do more migrations this
  // needs to consider the version number.
  const v0State = oldState as WorkspaceContextStoreV0;
  return {
    dialogs: {
      dataSource: {
        activeDataSource: v0State.dataSourceDialog.activeDataSource,
        item: v0State.dataSourceDialog.item,
        open: v0State.dataSourceDialog.open,
      },
      preferences: {
        initialTab: undefined,
        open: false,
      },
    },
    featureTours: {
      active: v0State.featureTours.active,
      shown: v0State.featureTours.shown,
    },
    sidebars: {
      legacy: {
        item: "connection",
      },
      left: {
        item: v0State.leftSidebarItem,
        open: v0State.leftSidebarOpen,
        size: v0State.leftSidebarSize,
      },
      right: {
        item: v0State.rightSidebarItem,
        open: v0State.rightSidebarOpen,
        size: v0State.rightSidebarSize,
      },
    },
    playbackControls: {
      repeat: v0State.playbackControls.repeat,
    },
  };
}

function createWorkspaceContextStore(
  initialState?: Partial<WorkspaceContextStore>,
): StoreApi<WorkspaceContextStore> {
  return createStore<WorkspaceContextStore>()(
    persist(
      () => {
        const store: WorkspaceContextStore = {
          dialogs: {
            dataSource: {
              activeDataSource: undefined,
              item: undefined,
              open: false,
            },
            preferences: {
              initialTab: undefined,
              open: false,
            },
          },
          featureTours: {
            active: undefined,
            shown: [],
          },
          sidebars: {
            legacy: {
              item: "connection",
            },
            left: {
              item: "panel-settings",
              open: true,
              size: undefined,
            },
            right: {
              item: undefined,
              open: false,
              size: undefined,
            },
          },
          playbackControls: {
            repeat: false,
          },

          ...initialState,
        };
        return store;
      },
      {
        name: "fox.workspace",
        version: 1,
        migrate: migrateV0State,
        partialize: (value) => {
          // Note that this is a list of keys from the store that we include and restore
          // when persisting to and from localStorage.
          return pick(value, ["featureTours", "playbackControls", "sidebars"]);
        },
      },
    ),
  );
}

export default function WorkspaceContextProvider({
  children,
  initialState,
}: {
  children?: ReactNode;
  initialState?: Partial<WorkspaceContextStore>;
}): JSX.Element {
  const [store] = useState(() => createWorkspaceContextStore(initialState));

  return <WorkspaceContext.Provider value={store}>{children}</WorkspaceContext.Provider>;
}
