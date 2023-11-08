// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { createContext, useContext } from "react";
import { StoreApi, createStore, useStore } from "zustand";

import {
  ExtensionPanelRegistration,
  Immutable,
  RegisterMessageConverterArgs,
} from "@foxglove/studio";
import { TopicAliasFunctions } from "@foxglove/studio-base/players/TopicAliasingPlayer/aliasing";
import { ExtensionInfo, ExtensionNamespace } from "@foxglove/studio-base/types/Extensions";

export type RegisteredPanel = {
  extensionName: string;
  extensionNamespace?: ExtensionNamespace;
  registration: ExtensionPanelRegistration;
};

export type ExtensionCatalog = Immutable<{
  downloadExtension: (url: string) => Promise<Uint8Array>;
  installExtension: (
    namespace: ExtensionNamespace,
    foxeFileData: Uint8Array,
  ) => Promise<ExtensionInfo>;
  refreshExtensions: () => Promise<void>;
  uninstallExtension: (namespace: ExtensionNamespace, id: string) => Promise<void>;

  installedExtensions: undefined | ExtensionInfo[];
  installedPanels: undefined | Record<string, RegisteredPanel>;
  installedMessageConverters: undefined | RegisterMessageConverterArgs<unknown>[];
  installedTopicAliasFunctions: undefined | TopicAliasFunctions;
}>;

export const ExtensionCatalogContext = createContext<undefined | StoreApi<ExtensionCatalog>>(
  undefined,
);

// Empty catalog if there is no actual catalog available
const EmptyExtensionCatalog: StoreApi<ExtensionCatalog> = createStore(() => ({
  downloadExtension: async () => await Promise.reject(new Error("unsupported")),
  installExtension: async () => await Promise.reject(new Error("unsupported")),
  refreshExtensions: async () => {
    await Promise.reject(new Error("unsupported"));
  },
  uninstallExtension: async () => {
    await Promise.reject(new Error("unsupported"));
  },

  installedExtensions: [],
  installedPanels: {},
  installedMessageConverters: [],
  installedTopicAliasFunctions: [],
}));

export function useExtensionCatalog<T>(selector: (registry: ExtensionCatalog) => T): T {
  const context = useContext(ExtensionCatalogContext);
  // Fallback to the empty extension catalog if there is no actual catalog
  return useStore(context ?? EmptyExtensionCatalog, selector);
}
