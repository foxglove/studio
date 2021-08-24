// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useMemo } from "react";

import LayoutManagerContext from "@foxglove/studio-base/context/LayoutManagerContext";
import { useLayoutStorage } from "@foxglove/studio-base/context/LayoutStorageContext";
import {
  ILayoutStorage,
  INamespacedLayoutStorage,
  Layout,
  LayoutID,
} from "@foxglove/studio-base/services/ILayoutStorage";
import LayoutManager from "@foxglove/studio-base/services/LayoutManager";

// const log = Logger.getLogger(__filename);

// const SYNC_INTERVAL = 15_000;

class NamespacedLayoutStorage implements ILayoutStorage {
  constructor(private storage: INamespacedLayoutStorage, private ns: string) {}
  async list(): Promise<readonly Layout[]> {
    return await this.storage.list(this.ns);
  }
  async get(id: LayoutID): Promise<Layout | undefined> {
    return await this.storage.get(this.ns, id);
  }
  async put(layout: Layout): Promise<Layout> {
    return await this.storage.put(this.ns, layout);
  }
  async delete(id: LayoutID): Promise<void> {
    await this.storage.delete(this.ns, id);
  }
}

export default function ConsoleApiLayoutStorageProvider({
  children,
}: React.PropsWithChildren<unknown>): JSX.Element {
  // const { addToast } = useToasts();
  // const [enableConsoleApiLayouts = false] = useAppConfigurationValue<boolean>(
  //   AppSetting.ENABLE_CONSOLE_API_LAYOUTS,
  // );
  // const api = useConsoleApi();
  // const currentUser = useCurrentUser();

  // const apiStorage = useMemo(() => new ConsoleApiRemoteLayoutStorage(api), [api]);

  const layoutStorage = useLayoutStorage();
  const localLayoutStorage = useMemo(
    // FIXME: namespace by user id when logged in?
    () => new NamespacedLayoutStorage(layoutStorage, "local"),
    [layoutStorage],
  );

  const layoutManager = useMemo(
    () => new LayoutManager({ storage: localLayoutStorage }),
    [localLayoutStorage],
  );

  // const sync = useCallback(async () => {
  //   try {
  //     const conflicts = await offlineStorage.syncWithRemote();
  //     log.info("synced, conflicts:", conflicts);
  //   } catch (error) {
  //     addToast(`Sync failed: ${error.message}`, {
  //       id: "ConsoleApiLayoutStorageProvider.syncError",
  //       appearance: "error",
  //     });
  //   }
  // }, [addToast, offlineStorage]);

  // const { online = false } = useNetworkState();
  // const visibilityState = useVisibilityState();

  // Sync periodically when logged in, online, and the app is not hidden
  // const enableSyncing =
  //   enableConsoleApiLayouts && currentUser != undefined && online && visibilityState === "visible";
  // useEffect(() => {
  //   if (enableSyncing) {
  //     void sync();
  //   }
  // }, [enableSyncing, sync]);
  // useInterval(
  //   sync,
  //   enableSyncing ? SYNC_INTERVAL : null /* eslint-disable-line no-restricted-syntax */,
  // );

  // const storage = enableConsoleApiLayouts && currentUser ? offlineStorage : cacheOnlyStorage;

  // const injectEdit = useCallback(
  //   async (id: LayoutID) => {
  //     const layout = await apiStorage.getLayout(id);
  //     if (!layout) {
  //       throw new Error("This layout doesn't exist on the server");
  //     }
  //     await apiStorage.updateLayout({
  //       targetID: layout.id,
  //       name: layout.name,
  //       data: {
  //         ...layout.data,
  //         layout: {
  //           direction: "row",
  //           first: `onboarding.welcome!${Math.round(Math.random() * 1e6).toString(36)}`,
  //           second: layout.data.layout ?? "unknown",
  //           splitPercentage: 33,
  //         },
  //       },
  //       ifUnmodifiedSince: layout.updatedAt,
  //     });
  //   },
  //   [apiStorage],
  // );

  // const injectRename = useCallback(
  //   async (id: LayoutID) => {
  //     const layout = await apiStorage.getLayout(id);
  //     if (!layout) {
  //       throw new Error("This layout doesn't exist on the server");
  //     }
  //     await apiStorage.updateLayout({
  //       targetID: layout.id,
  //       name: `${layout.name} renamed`,
  //       ifUnmodifiedSince: layout.updatedAt,
  //     });
  //   },
  //   [apiStorage],
  // );

  // const injectDelete = useCallback(
  //   async (id: LayoutID) => {
  //     const layout = await apiStorage.getLayout(id);
  //     if (!layout) {
  //       throw new Error("This layout doesn't exist on the server");
  //     }
  //     await apiStorage.deleteLayout({ targetID: id, ifUnmodifiedSince: layout.updatedAt });
  //   },
  //   [apiStorage],
  // );

  // const debugging = useShallowMemo({ syncNow: sync, injectEdit, injectRename, injectDelete });

  return (
    // <LayoutStorageDebuggingContext.Provider
    //   value={
    //     process.env.NODE_ENV !== "production" && enableConsoleApiLayouts && currentUser
    //       ? debugging
    //       : undefined
    //   }
    // >
    <LayoutManagerContext.Provider value={layoutManager}>{children}</LayoutManagerContext.Provider>
    // </LayoutStorageDebuggingContext.Provider>
  );
}
