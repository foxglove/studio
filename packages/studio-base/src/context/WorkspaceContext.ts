// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { createContext, useMemo, useState } from "react";
import { DeepReadonly } from "ts-essentials";
import { StoreApi, useStore } from "zustand";

import { AppSetting } from "@foxglove/studio-base/AppSetting";
import { useCurrentUser } from "@foxglove/studio-base/context/CurrentUserContext";
import { useAppConfigurationValue } from "@foxglove/studio-base/hooks";
import useGuaranteedContext from "@foxglove/studio-base/hooks/useGuaranteedContext";
import isDesktopApp from "@foxglove/studio-base/util/isDesktopApp";

export type SidebarItemKey =
  | "account"
  | "add-panel"
  | "connection"
  | "extensions"
  | "help"
  | "layouts"
  | "panel-settings"
  | "preferences"
  | "studio-logs-settings"
  | "variables";

export type LeftSidebarItemKey = "topics" | "variables" | "studio-logs-settings";
export type RightSidebarItemKey = "panel-settings" | "events";

export type WorkspaceContextStore = DeepReadonly<{
  layoutMenuOpen: boolean;
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  leftSidebarItem: undefined | LeftSidebarItemKey;
  leftSidebarSize: undefined | number;
  rightSidebarItem: undefined | RightSidebarItemKey;
  rightSidebarSize: undefined | number;
  sidebarItem: undefined | SidebarItemKey;
}>;

export const WorkspaceContext = createContext<undefined | StoreApi<WorkspaceContextStore>>(
  undefined,
);

WorkspaceContext.displayName = "WorkspaceContext";

export const WorkspaceStoreSelectors = {
  selectAll: (store: WorkspaceContextStore): WorkspaceContextStore => store,
  selectPanelSettingsOpen: (store: WorkspaceContextStore): boolean =>
    store.sidebarItem === "panel-settings" || store.rightSidebarItem === "panel-settings",
};

/**
 * Fetches values from the workspace store.
 */
export function useWorkspaceStore<T>(
  selector: (store: WorkspaceContextStore) => T,
  equalityFn?: (a: T, b: T) => boolean,
): T {
  const context = useGuaranteedContext(WorkspaceContext);
  return useStore(context, selector, equalityFn);
}

export type WorkspaceActions = {
  openPanelSettings: () => void;
  openAccountSettings: () => void;
  openLayoutBrowser: () => void;
  selectSidebarItem: (selectedSidebarItem: undefined | SidebarItemKey) => void;
  selectLeftSidebarItem: (item: undefined | LeftSidebarItemKey) => void;
  selectRightSidebarItem: (item: undefined | RightSidebarItemKey) => void;
  // eslint-disable-next-line @foxglove/no-boolean-parameters
  setLayoutMenuOpen: (open: boolean) => void;
  // eslint-disable-next-line @foxglove/no-boolean-parameters
  setLeftSidebarOpen: (open: boolean) => void;
  setLeftSidebarSize: (size: undefined | number) => void;
  // eslint-disable-next-line @foxglove/no-boolean-parameters
  setRightSidebarOpen: (open: boolean) => void;
  setRightSidebarSize: (size: undefined | number) => void;
};

/**
 * Provides various actions to manipulate the workspace state.
 */
export function useWorkspaceActions(): WorkspaceActions {
  const { setState: set } = useGuaranteedContext(WorkspaceContext);

  const { signIn } = useCurrentUser();
  const supportsAccountSettings = signIn != undefined;

  const [currentEnableNewTopNav = false] = useAppConfigurationValue<boolean>(
    AppSetting.ENABLE_NEW_TOPNAV,
  );
  const [initialEnableNewTopNav] = useState(currentEnableNewTopNav);
  const enableNewTopNav = isDesktopApp() ? initialEnableNewTopNav : currentEnableNewTopNav;

  return useMemo(() => {
    return {
      openPanelSettings: () =>
        enableNewTopNav
          ? set({ rightSidebarItem: "panel-settings", rightSidebarOpen: true })
          : set({ sidebarItem: "panel-settings" }),

      openAccountSettings: () => supportsAccountSettings && set({ sidebarItem: "account" }),

      openLayoutBrowser: () =>
        enableNewTopNav ? set({ layoutMenuOpen: true }) : set({ sidebarItem: "layouts" }),

      // eslint-disable-next-line @foxglove/no-boolean-parameters
      setLayoutMenuOpen: (layoutMenuOpen: boolean) => set({ layoutMenuOpen }),

      selectSidebarItem: (selectedSidebarItem: undefined | SidebarItemKey) =>
        set({ sidebarItem: selectedSidebarItem }),

      selectLeftSidebarItem: (selectedLeftSidebarItem: undefined | LeftSidebarItemKey) => {
        set({
          leftSidebarItem: selectedLeftSidebarItem,
          leftSidebarOpen: selectedLeftSidebarItem != undefined,
        });
      },

      selectRightSidebarItem: (selectedRightSidebarItem: undefined | RightSidebarItemKey) => {
        set({
          rightSidebarItem: selectedRightSidebarItem,
          rightSidebarOpen: selectedRightSidebarItem != undefined,
        });
      },

      // eslint-disable-next-line @foxglove/no-boolean-parameters
      setLeftSidebarOpen: (leftSidebarOpen: boolean) => {
        if (leftSidebarOpen) {
          set((oldValue) => ({
            leftSidebarOpen,
            leftSidebarItem: oldValue.leftSidebarItem ?? "topics",
          }));
        } else {
          set({ leftSidebarOpen: false });
        }
      },

      setLeftSidebarSize: (leftSidebarSize: undefined | number) => set({ leftSidebarSize }),

      // eslint-disable-next-line @foxglove/no-boolean-parameters
      setRightSidebarOpen: (rightSidebarOpen: boolean) => {
        if (rightSidebarOpen) {
          set((oldValue) => ({
            rightSidebarOpen,
            rightSidebarItem: oldValue.rightSidebarItem ?? "panel-settings",
          }));
        } else {
          set({ rightSidebarOpen: false });
        }
      },

      setRightSidebarSize: (rightSidebarSize: undefined | number) => set({ rightSidebarSize }),
    };
  }, [enableNewTopNav, set, supportsAccountSettings]);
}
