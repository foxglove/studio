// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import JSZip from "jszip";

import Log from "@foxglove/log";
import { ExtensionInfo, ExtensionLoader, IExtensionStorage } from "@foxglove/studio-base";

const log = Log.getLogger(__filename);

export class WebExtensionLoader implements ExtensionLoader {
  readonly #storage: IExtensionStorage;

  constructor(storage: IExtensionStorage) {
    this.#storage = storage;
  }

  async getExtensions(): Promise<ExtensionInfo[]> {
    log.debug("Listing extensions");

    return await this.#storage.list("local");
  }

  async loadExtension(id: string): Promise<string> {
    log.debug("Loading extension", id);

    const extension = await this.#storage.get("local", id);
    const zip = new JSZip();

    if (extension?.content == undefined) {
      throw new Error("Extension is corrupted");
    }

    const content = await zip.loadAsync(extension.content);
    const srcText = await content.file("dist/extension.js")?.async("string");

    if (srcText == undefined) {
      throw new Error("Extension is corrupted");
    }

    return srcText;
  }

  async downloadExtension(url: string): Promise<Uint8Array> {
    log.debug("Downloading extension", url);

    const res = await fetch(url);
    return new Uint8Array(await res.arrayBuffer());
  }

  async installExtension(foxeFileData: Uint8Array): Promise<ExtensionInfo> {
    log.debug("Installing extension");

    const zip = new JSZip();
    const content = await zip.loadAsync(foxeFileData);

    const pkgInfoText = await content.file("package.json")?.async("string");
    if (pkgInfoText == undefined) {
      throw new Error("Invalid extension: missing package.json");
    }

    const pkgInfo: ExtensionInfo = JSON.parse(pkgInfoText);
    await this.#storage.put("local", {
      id: pkgInfo.name,
      content: foxeFileData,
      info: { ...pkgInfo, id: pkgInfo.name },
    });
    return { ...pkgInfo, id: pkgInfo.name };
  }

  async uninstallExtension(id: string): Promise<boolean> {
    log.debug("Uninstalling extension", id);

    await this.#storage.delete("local", id);
    return true;
  }
}
