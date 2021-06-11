// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { existsSync } from "fs";
import { mkdir, readdir, readFile, rm, writeFile } from "fs/promises";
import JSZip from "jszip";
import { dirname, join as pathJoin } from "path";

import Logger from "@foxglove/log";
import {
  ExtensionPackageJson,
  getPackageDirname,
  getPackageId,
} from "@foxglove/studio-base/src/util/extensions";

import { DesktopExtension } from "../common/types";

const log = Logger.getLogger(__filename);

export async function loadExtensions(rootFolder: string): Promise<DesktopExtension[]> {
  const extensions: DesktopExtension[] = [];

  if (!existsSync(rootFolder)) {
    return extensions;
  }

  const rootFolderContents = await readdir(rootFolder, { withFileTypes: true });
  for (const entry of rootFolderContents) {
    if (!entry.isDirectory()) {
      continue;
    }
    try {
      log.debug(`Loading extension at ${entry.name}`);
      const extensionRootPath = pathJoin(rootFolder, entry.name);
      const packagePath = pathJoin(extensionRootPath, "package.json");

      const packageData = await readFile(packagePath, { encoding: "utf8" });

      const packageJson = JSON.parse(packageData);
      const sourcePath = pathJoin(extensionRootPath, packageJson.main);

      const source = await readFile(sourcePath, { encoding: "utf-8" });
      extensions.push({ packageJson, source, directory: extensionRootPath });
    } catch (err) {
      log.error(err);
    }
  }

  return extensions;
}

export async function installExtension(
  foxeFileData: Uint8Array,
  rootFolder: string,
): Promise<string> {
  // Open the archive
  const archive = await JSZip.loadAsync(foxeFileData);

  // Check for a package.json file
  const pkgJsonZipObj = archive.files["package.json"];
  if (pkgJsonZipObj == undefined) {
    throw new Error(`Extension does not contain a package.json file`);
  }

  // Unpack and parse the package.json file
  let pkgJson: ExtensionPackageJson;
  try {
    pkgJson = JSON.parse(await pkgJsonZipObj.async("string"));
  } catch (err) {
    log.error(err);
    throw new Error(`Extension contains an invalid package.json`);
  }

  // Check for basic validity of package.json and get the packageId
  const packageId = getPackageId(pkgJson);

  // Build the extension folder name based on package.json fields
  const dir = getPackageDirname(pkgJson);

  // Delete any previous installation and create the extension folder
  const extensionBaseDir = pathJoin(rootFolder, dir);
  await rm(extensionBaseDir, { recursive: true, force: true });
  await mkdir(extensionBaseDir, { recursive: true });

  // Unpack all files into the extension folder
  for (const [relPath, zipObj] of Object.entries(archive.files)) {
    const filePath = pathJoin(extensionBaseDir, relPath);
    if (zipObj.dir) {
      await mkdir(dirname(filePath), { recursive: true });
    } else {
      const fileData = await zipObj.async("uint8array");
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, fileData);
    }
  }

  return packageId;
}

export async function uninstallExtension(id: string, rootFolder: string): Promise<boolean> {
  log.debug(`Searching for extension ${id} in ${rootFolder} to uninstall`);

  // Find this extension
  const userExtensions = await loadExtensions(rootFolder);
  const extension = userExtensions.find(
    (ext) => getPackageId(ext.packageJson as ExtensionPackageJson) === id,
  );
  if (extension == undefined) {
    log.error(`Extension ${id} was not found, searched ${userExtensions.length} extensions`);
    return false;
  }

  // Delete the extension directory and contents
  log.info(`Deleting extension directory ${extension.directory}`);
  await rm(extension.directory, { recursive: true, force: true });
  return true;
}
