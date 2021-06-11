// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { PropsWithChildren } from "react";
import { useAsync } from "react-use";

import Logger from "@foxglove/log";
import {
  getPackageId,
  ExtensionLoaderContext,
  ExtensionLoader,
  ExtensionDetail,
} from "@foxglove/studio-base";

import { Desktop } from "../../common/types";

const log = Logger.getLogger(__filename);
const desktopBridge = (global as { desktopBridge?: Desktop }).desktopBridge;

type PackageInfo = {
  name: string;
  displayName: string;
  description: string;
  publisher: string;
  homepage: string;
  license: string;
  version: string;
  keywords: string[];
};

export default function ExtensionLoaderProvider(props: PropsWithChildren<unknown>): JSX.Element {
  const { value: extensionLoader, error } = useAsync(async () => {
    const extensionList = (await desktopBridge?.getExtensions()) ?? [];
    log.debug(`Loaded ${extensionList?.length ?? 0} extension(s)`);

    const extensions = extensionList.map<ExtensionDetail>((item) => {
      const pkgInfo = item.packageJson as PackageInfo;
      return {
        id: getPackageId(pkgInfo),
        name: pkgInfo.displayName,
        description: pkgInfo.description,
        publisher: pkgInfo.publisher,
        homepage: pkgInfo.homepage,
        license: pkgInfo.license,
        version: pkgInfo.version,
        keywords: pkgInfo.keywords,
        source: item.source,
      };
    });

    const loader: ExtensionLoader = {
      getExtensions: () => Promise.resolve(extensions),
      async installExtension(foxeFileData: Uint8Array): Promise<ExtensionDetail> {
        if (desktopBridge == undefined) {
          throw new Error(`Cannot install extension without a desktopBridge`);
        }
        const id = await desktopBridge.installExtension(foxeFileData);
        const updatedExtensionList = await desktopBridge.getExtensions();
        const entry = updatedExtensionList.find(
          (extension) => (extension.packageJson as PackageInfo).name === id,
        );
        if (entry == undefined) {
          throw new Error(
            `Installed extension ${id} from ${foxeFileData.byteLength} byte file but it was not found after installation`,
          );
        }

        // FIXME: Refresh the list of installed extensions

        const newPkgInfo = entry.packageJson as PackageInfo;
        return {
          id: getPackageId(newPkgInfo),
          name: newPkgInfo.displayName,
          description: newPkgInfo.description,
          publisher: newPkgInfo.publisher,
          homepage: newPkgInfo.homepage,
          license: newPkgInfo.license,
          version: newPkgInfo.version,
          keywords: newPkgInfo.keywords,
          source: entry.source,
        };
      },
      async uninstallExtension(id: string): Promise<boolean> {
        const uninstalled = (await desktopBridge?.uninstallExtension(id)) ?? false;

        // FIXME: Refresh the list of installed extensions

        return uninstalled;
      },
    };

    return loader;
  }, []);

  if (error) {
    throw error;
  }

  if (!extensionLoader) {
    return <></>;
  }

  return (
    <ExtensionLoaderContext.Provider value={extensionLoader}>
      {props.children}
    </ExtensionLoaderContext.Provider>
  );
}
