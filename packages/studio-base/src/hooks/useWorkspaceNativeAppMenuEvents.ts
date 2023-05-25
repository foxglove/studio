// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useCallback } from "react";

import { useWorkspaceActions } from "@foxglove/studio-base/context/Workspace/useWorkspaceActions";
import useNativeAppMenuEvent from "@foxglove/studio-base/hooks/useNativeAppMenuEvent";

/**
 * Bundles setup of all native app menu events used in the workspace.
 */
export function useWorkspaceNativeAppMenuEvents(): void {
  const { dialogActions, sidebarActions } = useWorkspaceActions();

  useNativeAppMenuEvent(
    "open-layouts",
    useCallback(() => {
      sidebarActions.legacy.selectItem("layouts");
    }, [sidebarActions.legacy]),
  );

  useNativeAppMenuEvent(
    "open-add-panel",
    useCallback(() => {
      sidebarActions.legacy.selectItem("add-panel");
    }, [sidebarActions.legacy]),
  );

  useNativeAppMenuEvent(
    "open-panel-settings",
    useCallback(() => {
      sidebarActions.legacy.selectItem("panel-settings");
    }, [sidebarActions.legacy]),
  );

  useNativeAppMenuEvent(
    "open-variables",
    useCallback(() => {
      sidebarActions.legacy.selectItem("variables");
    }, [sidebarActions.legacy]),
  );

  useNativeAppMenuEvent(
    "open-extensions",
    useCallback(() => {
      sidebarActions.legacy.selectItem("extensions");
    }, [sidebarActions.legacy]),
  );

  useNativeAppMenuEvent(
    "open-account",
    useCallback(() => {
      sidebarActions.legacy.selectItem("account");
    }, [sidebarActions.legacy]),
  );

  useNativeAppMenuEvent(
    "open-app-settings",
    useCallback(() => {
      dialogActions.preferences.open();
    }, [dialogActions.preferences]),
  );

  useNativeAppMenuEvent(
    "open-file",
    useCallback(async () => await dialogActions.openFile.open(), [dialogActions.openFile]),
  );

  useNativeAppMenuEvent(
    "open-remote-file",
    useCallback(() => dialogActions.dataSource.open("remote"), [dialogActions.dataSource]),
  );

  useNativeAppMenuEvent(
    "open-sample-data",
    useCallback(() => dialogActions.dataSource.open("demo"), [dialogActions.dataSource]),
  );
}
