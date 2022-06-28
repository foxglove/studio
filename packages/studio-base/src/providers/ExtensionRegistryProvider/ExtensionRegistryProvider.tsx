// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { PropsWithChildren, useCallback, useEffect, useMemo } from "react";
import { useAsyncFn } from "react-use";

import Logger from "@foxglove/log";
import ExtensionRegistryContext from "@foxglove/studio-base/context/ExtensionRegistryContext";
import { ExtensionLoader } from "@foxglove/studio-base/services/ExtensionLoader";
import { ExtensionInfo, ExtensionNamespace } from "@foxglove/studio-base/types/Extensions";

import { useExtensionPanels } from "./useExtensionPanels";

const log = Logger.getLogger(__filename);

const NO_EXTENSIONS: ExtensionInfo[] = [];

const NO_PANELS = {};

export default function ExtensionRegistryProvider({
  children,
  loaders,
}: PropsWithChildren<{ loaders: readonly ExtensionLoader[] }>): JSX.Element {
  const [registeredExtensions, refreshExtensions] = useAsyncFn(async () => {
    const extensionList = (
      await Promise.all(loaders.map(async (loader) => await loader.getExtensions()))
    )
      .flat()
      .sort();
    log.debug(`Found ${extensionList.length} extension(s)`);
    return extensionList;
  }, [loaders]);

  const downloadExtension = useCallback(async (url: string) => {
    const res = await fetch(url);
    return new Uint8Array(await res.arrayBuffer());
  }, []);

  const loadExtension = useCallback(
    async (id: string) => {
      for (const loader of loaders) {
        try {
          return await loader.loadExtension(id);
        } catch (error) {
          log.debug(error);
        }
      }

      throw new Error(`Extension ${id} not found`);
    },
    [loaders],
  );

  const installExtension = useCallback(
    async (namespace: ExtensionNamespace, foxeFileData: Uint8Array) => {
      const namespacedLoader = loaders.find((loader) => loader.namespace === namespace);
      if (namespacedLoader == undefined) {
        throw new Error("No extension loader found for namespace " + namespace);
      }
      const info = await namespacedLoader.installExtension(foxeFileData);
      await refreshExtensions();
      return info;
    },
    [loaders, refreshExtensions],
  );

  const uninstallExtension = useCallback(
    async (namespace: ExtensionNamespace, id: string) => {
      const namespacedLoader = loaders.find((loader) => loader.namespace === namespace);
      if (namespacedLoader == undefined) {
        throw new Error("No extension loader found for namespace " + namespace);
      }
      await namespacedLoader.uninstallExtension(id);
      await refreshExtensions();
    },
    [loaders, refreshExtensions],
  );

  const registeredPanels = useExtensionPanels(
    registeredExtensions.value ?? NO_EXTENSIONS,
    loadExtension,
  );

  useEffect(() => {
    refreshExtensions().catch((error) => log.error(error));
  }, [refreshExtensions]);

  const value = useMemo(
    () => ({
      downloadExtension,
      installExtension,
      loadExtension,
      refreshExtensions,
      registeredExtensions: registeredExtensions.value ?? NO_EXTENSIONS,
      registeredPanels: registeredPanels.value ?? NO_PANELS,
      uninstallExtension,
    }),
    [
      downloadExtension,
      installExtension,
      loadExtension,
      refreshExtensions,
      registeredExtensions.value,
      registeredPanels.value,
      uninstallExtension,
    ],
  );

  if (registeredExtensions.error) {
    throw registeredExtensions.error;
  }

  if (!registeredExtensions.value) {
    return <></>;
  }

  return (
    <ExtensionRegistryContext.Provider value={value}>{children}</ExtensionRegistryContext.Provider>
  );
}
