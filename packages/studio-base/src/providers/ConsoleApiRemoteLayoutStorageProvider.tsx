// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useCallback, useMemo } from "react";

import { useShallowMemo } from "@foxglove/hooks";
import { AppSetting } from "@foxglove/studio-base/AppSetting";
import { useConsoleApi } from "@foxglove/studio-base/context/ConsoleApiContext";
import { useCurrentUser } from "@foxglove/studio-base/context/CurrentUserContext";
import LayoutStorageDebuggingContext from "@foxglove/studio-base/context/LayoutStorageDebuggingContext";
import RemoteLayoutStorageContext from "@foxglove/studio-base/context/RemoteLayoutStorageContext";
import { useAppConfigurationValue } from "@foxglove/studio-base/hooks/useAppConfigurationValue";
import ConsoleApiRemoteLayoutStorage from "@foxglove/studio-base/services/ConsoleApiRemoteLayoutStorage";
import { ISO8601Timestamp, LayoutID } from "@foxglove/studio-base/services/ILayoutStorage";

export default function ConsoleApiRemoteLayoutStorageProvider({
  children,
}: React.PropsWithChildren<unknown>): JSX.Element {
  const [enableConsoleApiLayouts = false] = useAppConfigurationValue<boolean>(
    AppSetting.ENABLE_CONSOLE_API_LAYOUTS,
  );
  const api = useConsoleApi();
  const currentUser = useCurrentUser();

  const apiStorage = useMemo(
    () =>
      enableConsoleApiLayouts && currentUser
        ? new ConsoleApiRemoteLayoutStorage(currentUser.id, api)
        : undefined,
    [api, currentUser, enableConsoleApiLayouts],
  );

  const injectEdit = useCallback(
    async (id: LayoutID) => {
      const layout = await apiStorage?.getLayout(id);
      if (!layout) {
        throw new Error("This layout doesn't exist on the server");
      }
      await apiStorage?.updateLayout({
        id: layout.id,
        name: layout.name,
        data: {
          ...layout.data,
          layout: {
            direction: "row",
            first: `onboarding.welcome!${Math.round(Math.random() * 1e6).toString(36)}`,
            second: layout.data.layout ?? "unknown",
            splitPercentage: 33,
          },
        },
        savedAt: new Date().toISOString() as ISO8601Timestamp,
      });
    },
    [apiStorage],
  );

  const injectRename = useCallback(
    async (id: LayoutID) => {
      const layout = await apiStorage?.getLayout(id);
      if (!layout) {
        throw new Error("This layout doesn't exist on the server");
      }
      await apiStorage?.updateLayout({
        id,
        name: `${layout.name} renamed`,
        savedAt: new Date().toISOString() as ISO8601Timestamp,
      });
    },
    [apiStorage],
  );

  const injectDelete = useCallback(
    async (id: LayoutID) => {
      await apiStorage?.deleteLayout(id);
    },
    [apiStorage],
  );

  const debugging = useShallowMemo({ injectEdit, injectRename, injectDelete });

  return (
    <LayoutStorageDebuggingContext.Provider
      value={
        process.env.NODE_ENV !== "production" && enableConsoleApiLayouts && currentUser
          ? debugging
          : undefined
      }
    >
      <RemoteLayoutStorageContext.Provider value={apiStorage}>
        {children}
      </RemoteLayoutStorageContext.Provider>
    </LayoutStorageDebuggingContext.Provider>
  );
}
