// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

export type ExtensionInfo = {
  id: string;
  description: string;
  displayName: string;
  homepage: string;
  keywords: string[];
  license: string;
  name: string;
  namespace?: string;
  publisher: string;
  qualifiedName: string;
  version: string;
};

export type ExtensionNamespace = "local" | "private";

export interface ExtensionLoader {
  readonly namespace: ExtensionNamespace;

  // get a list of installed extensions
  getExtensions(): Promise<ExtensionInfo[]>;

  // load the source code for a specific extension
  loadExtension(id: string): Promise<string>;

  // install extension contained within the file data
  installExtension(foxeFileData: Uint8Array): Promise<ExtensionInfo>;

  // uninstall extension with id
  // return true if the extension was found and uninstalled, false if not found
  uninstallExtension(id: string): Promise<boolean>;
}
