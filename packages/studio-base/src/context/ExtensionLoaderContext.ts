// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { createContext, useCallback, useContext, useMemo } from "react";

import Logger from "@foxglove/log";

export type ExtensionInfo = {
  id: string;
  name: string;
  qualifiedName: string;
  displayName: string;
  description: string;
  publisher: string;
  homepage: string;
  license: string;
  version: string;
  keywords: string[];
};

export interface ExtensionLoader {
  // get a list of installed extensions
  getExtensions(): Promise<ExtensionInfo[]>;

  // load the source code for a specific extension
  loadExtension(id: string): Promise<string>;

  // download a .foxe file from a web URL and store it in memory. The resulting binary data can be
  // passed into `installExtension`
  downloadExtension(url: string): Promise<Uint8Array>;

  // install extension contained within the file data
  installExtension(foxeFileData: Uint8Array): Promise<ExtensionInfo>;

  // uninstall extension with id
  // return true if the extension was found and uninstalled, false if not found
  uninstallExtension(id: string): Promise<boolean>;
}

const log = Logger.getLogger(__filename);

const ExtensionLoaderContext = createContext<ExtensionLoader[] | undefined>(undefined);
ExtensionLoaderContext.displayName = "ExtensionLoaderContext";

/**
 * Presents a unified interface for all enabled extension loaders.
 */
export function useExtensionLoader(): ExtensionLoader {
  const extensionLoaders = useContext(ExtensionLoaderContext);
  if (extensionLoaders == undefined) {
    throw new Error("An ExtensionLoaderContext provider is required to useExtensionLoader");
  }

  const getExtensions = useCallback(
    async () =>
      (await Promise.all(extensionLoaders.map(async (loader) => await loader.getExtensions())))
        .flat()
        .sort(),
    [extensionLoaders],
  );

  const loadExtension = useCallback(
    async (id: string) => {
      for (const loader of extensionLoaders) {
        try {
          const extension = await loader.loadExtension(id);
          return extension;
        } catch (error) {
          log.debug(error);
        }
      }

      throw new Error(`Extension ${id} not found`);
    },
    [extensionLoaders],
  );

  const downloadExtension = useCallback(
    async (url: string) => {
      for (const loader of extensionLoaders) {
        try {
          const data = await loader.downloadExtension(url);
          return data;
        } catch (e) {
          log.debug(e);
        }
      }

      throw new Error(`Error downloading extension from ${url}`);
    },
    [extensionLoaders],
  );

  const installExtension = useCallback(
    async (foxeFileData: Uint8Array) => {
      for (const loader of extensionLoaders) {
        try {
          const extension = await loader.installExtension(foxeFileData);
          return extension;
        } catch (error) {
          log.debug(error);
        }
      }

      throw new Error("Error installing extension");
    },
    [extensionLoaders],
  );

  const uninstallExtension = useCallback(
    async (id: string) => {
      for (const loader of extensionLoaders) {
        try {
          const extension = await loader.uninstallExtension(id);
          if (extension) {
            return extension;
          }
        } catch (error) {
          log.debug(error);
        }
      }

      throw new Error(`Extension ${id} not found`);
    },
    [extensionLoaders],
  );

  const value = useMemo(
    () => ({
      downloadExtension,
      getExtensions,
      installExtension,
      loadExtension,
      uninstallExtension,
    }),
    [downloadExtension, getExtensions, installExtension, loadExtension, uninstallExtension],
  );

  return value;
}

export default ExtensionLoaderContext;
