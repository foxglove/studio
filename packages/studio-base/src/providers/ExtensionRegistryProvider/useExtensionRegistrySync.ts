// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { differenceWith } from "lodash";
import { useCallback, useEffect } from "react";
import { useLatest, useTimeoutFn } from "react-use";

import Logger from "@foxglove/log";
import { useConsoleApi } from "@foxglove/studio-base/context/ConsoleApiContext";
import { useCurrentUser } from "@foxglove/studio-base/context/CurrentUserContext";
import { useExtensionRegistry } from "@foxglove/studio-base/context/ExtensionRegistryContext";

const log = Logger.getLogger(__filename);

const SYNC_INTERVAL = 10 * 60 * 1_000; // 10 minutes

/**
 * Implements private registry extension syncing.
 */
export function useExtensionRegistrySync(): void {
  const installedExtensions = useExtensionRegistry().registeredExtensions;
  const installExtension = useExtensionRegistry().installExtension;
  const uninstallExtension = useExtensionRegistry().uninstallExtension;

  const api = useConsoleApi();
  const user = useCurrentUser();

  const fetchExtensions = useCallback(async () => {
    if (user.currentUser == undefined) {
      return undefined;
    }
    const result = await api.getExtensions();
    return result;
  }, [api, user.currentUser]);

  const installRemoteExtension = useCallback(
    async (id: string) => {
      const metaData = await api.getExtension(id);
      const dataResponse = await fetch(metaData.foxe);
      const data = new Uint8Array(await dataResponse.arrayBuffer());
      await installExtension("private", data);
    },
    [api, installExtension],
  );

  // Use polling for now. To be replaced with some kind of notification mechanism.
  const [_ready, _cancel, resetTimeout] = useTimeoutFn(
    async () => await syncExtensions(),
    SYNC_INTERVAL,
  );

  const latestInstalledExtensions = useLatest(installedExtensions);

  const syncExtensions = useCallback(async () => {
    try {
      const start = performance.now();
      log.debug("Starting private extension sync.");

      const remoteExtensions = await fetchExtensions();
      if (remoteExtensions == undefined) {
        return;
      }

      const installedPrivateExtensions = latestInstalledExtensions.current.filter(
        (extension) => extension.namespace === "private",
      );

      const toInstall = differenceWith(
        remoteExtensions,
        installedPrivateExtensions,
        (a, b) => a.name === b.name && a.version === b.version,
      );

      const toRemove = differenceWith(
        installedPrivateExtensions,
        remoteExtensions,
        (a, b) => a.name === b.name,
      );

      for (const extension of toInstall) {
        try {
          await installRemoteExtension(extension.id);
        } catch (error) {
          log.error(error);
        }
      }

      for (const extension of toRemove) {
        try {
          await uninstallExtension("private", extension.id);
        } catch (error) {
          log.error(error);
        }
      }

      log.debug(
        `Completed private extension sync in ${((performance.now() - start) / 1000).toFixed(2)}s`,
      );
    } catch (error) {
      log.error(error);
    } finally {
      resetTimeout();
    }
  }, [
    fetchExtensions,
    installRemoteExtension,
    latestInstalledExtensions,
    resetTimeout,
    uninstallExtension,
  ]);

  // Do initial sync on startup.
  useEffect(() => {
    syncExtensions().catch((error) => log.error(error));
  }, [syncExtensions]);
}
