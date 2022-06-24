// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { PropsWithChildren, useEffect, useMemo } from "react";
import ReactDOM from "react-dom";
import { useAsync, useAsyncFn } from "react-use";

import Logger from "@foxglove/log";
import { ExtensionContext, ExtensionModule } from "@foxglove/studio";
import { useExtensionLoader } from "@foxglove/studio-base/context/ExtensionLoaderContext";
import ExtensionRegistryContext, {
  RegisteredPanel,
} from "@foxglove/studio-base/context/ExtensionRegistryContext";

const log = Logger.getLogger(__filename);

export default function ExtensionRegistryProvider(props: PropsWithChildren<unknown>): JSX.Element {
  const extensionLoader = useExtensionLoader();

  const [registeredExtensions, refreshExtensions] = useAsyncFn(async () => {
    const extensionList = await extensionLoader.getExtensions();
    log.debug(`Found ${extensionList.length} extension(s)`);
    return extensionList;
  });

  const registeredPanels = useAsync(async () => {
    // registered panels stored by their fully qualified id
    // the fully qualified id is the extension name + panel name
    const panels: Record<string, RegisteredPanel> = {};

    for (const extension of registeredExtensions.value ?? []) {
      log.debug(`Activating extension ${extension.qualifiedName}`);

      const module = { exports: {} };
      const require = (name: string) => {
        return { react: React, "react-dom": ReactDOM }[name];
      };

      const extensionMode =
        process.env.NODE_ENV === "production"
          ? "production"
          : process.env.NODE_ENV === "test"
          ? "test"
          : "development";

      const ctx: ExtensionContext = {
        mode: extensionMode,

        registerPanel(params) {
          log.debug(`Extension ${extension.qualifiedName} registering panel: ${params.name}`);

          const fullId = `${extension.qualifiedName}.${params.name}`;
          if (panels[fullId]) {
            log.warn(`Panel ${fullId} is already registered`);
            return;
          }

          panels[fullId] = {
            extensionName: extension.qualifiedName,
            registration: params,
          };
        },
      };

      try {
        const unwrappedExtensionSource = await extensionLoader.loadExtension(extension.id);

        // eslint-disable-next-line no-new-func
        const fn = new Function("module", "require", unwrappedExtensionSource);

        // load the extension module exports
        fn(module, require, {});
        const wrappedExtensionModule = module.exports as ExtensionModule;

        wrappedExtensionModule.activate(ctx);
      } catch (err) {
        log.error(err);
      }
    }

    return panels;
  }, [extensionLoader, registeredExtensions.value]);

  useEffect(() => {
    refreshExtensions().catch((error) => log.error(error));
  }, [refreshExtensions]);

  const value = useMemo(
    () => ({
      refreshExtensions: async () => {
        await refreshExtensions();
      },
      registeredExtensions: registeredExtensions.value ?? [],
      registeredPanels: registeredPanels.value ?? {},
    }),
    [refreshExtensions, registeredExtensions.value, registeredPanels.value],
  );

  if (registeredExtensions.error) {
    throw registeredExtensions.error;
  }

  if (!registeredExtensions.value) {
    return <></>;
  }

  return (
    <ExtensionRegistryContext.Provider value={value}>
      {props.children}
    </ExtensionRegistryContext.Provider>
  );
}
