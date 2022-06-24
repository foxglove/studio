// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { createContext, useContext } from "react";
import { DeepReadonly } from "ts-essentials";

import { ExtensionPanelRegistration } from "@foxglove/studio";
import { ExtensionInfo } from "@foxglove/studio-base/context/ExtensionLoaderContext";

export type RegisteredPanel = {
  extensionName: string;
  namespace?: string;
  registration: ExtensionPanelRegistration;
};

export type ExtensionRegistry = {
  refreshExtensions: () => Promise<void>;
  registeredExtensions: ExtensionInfo[];
  registeredPanels: Record<string, RegisteredPanel>;
};

const ExtensionRegistryContext = createContext<DeepReadonly<ExtensionRegistry> | undefined>(
  undefined,
);
ExtensionRegistryContext.displayName = "ExtensionRegistryContext";

export function useExtensionRegistry(): DeepReadonly<ExtensionRegistry> {
  const extensionRegistry = useContext(ExtensionRegistryContext);
  if (extensionRegistry == undefined) {
    throw new Error("An ExtensionRegistryContext provider is required to useExtensionRegistry");
  }
  return extensionRegistry;
}

export default ExtensionRegistryContext;
