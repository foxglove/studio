// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { ExtensionInfo } from "@foxglove/studio-base/context/ExtensionLoaderContext";

export type StoredExtension = {
  id: string;
  info: ExtensionInfo;
  content: Uint8Array;
};

export interface IExtensionStorage {
  list(namespace: string): Promise<ExtensionInfo[]>;
  get(namespace: string, id: string): Promise<undefined | StoredExtension>;
  put(namespace: string, extension: StoredExtension): Promise<StoredExtension>;
  delete(namespace: string, id: string): Promise<void>;
}
