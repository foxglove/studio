// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { existsSync } from "fs";
import { mkdir, readdir, readFile, rm, writeFile } from "fs/promises";
import JSZip from "jszip";
import { dirname, join as pathJoin } from "path";

import Logger from "@foxglove/log";

import { DesktopExtension } from "../common/types";

type PackageJson = { name: string; version: string; publisher?: string };

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
  const packageJsonZipObj = archive.files["package.json"];
  if (packageJsonZipObj == undefined) {
    throw new Error(`Extension does not contain a package.json file`);
  }

  // Unpack and parse the package.json file
  let packageJson: Record<string, unknown>;
  try {
    packageJson = JSON.parse(await packageJsonZipObj.async("string"));
  } catch (err) {
    log.error(err);
    throw new Error(`Extension contains an invalid package.json`);
  }

  // Check for basic validity of package.json
  const packageId = packageJson.name;
  if (typeof packageId !== "string") {
    throw new Error(`package.json is missing required "name" field`);
  }
  if (typeof packageJson.version !== "string") {
    throw new Error(`package.json is missing required "version" field`);
  }

  // Build the extension folder name based on package.json fields
  const dir = getPackageDirname(packageJson as PackageJson);
  if (dir.length >= 255) {
    throw new Error(`Extension publisher+name+version is too long`);
  }

  // Create the extension folder
  const extensionBaseDir = pathJoin(rootFolder, dir);
  await mkdir(extensionBaseDir, { recursive: true });

  // Unpack all files into the extension folder
  for (const [relPath, zipObj] of Object.entries(archive.files)) {
    const fileData = await zipObj.async("uint8array");
    const filePath = pathJoin(extensionBaseDir, relPath);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, fileData);
  }

  return packageId;
}

export async function uninstallExtension(id: string, rootFolder: string): Promise<boolean> {
  // Find this extension
  const userExtensions = await loadExtensions(rootFolder);
  const extension = userExtensions.find((ext) => (ext.packageJson as { name: string }).name === id);
  if (extension == undefined) {
    return false;
  }

  // Delete the extension directory and contents
  await rm(extension.directory, { recursive: true, force: true });
  return true;
}

function getPackageDirname(pkgJson: PackageJson): string {
  const pkgName = parsePackageName(pkgJson.name);
  const publisher = pkgJson.publisher ?? pkgName.namespace;
  if (publisher == undefined || publisher.length === 0) {
    throw new Error(`package.json is missing required "publisher" field`);
  }

  return `${publisher}.${pkgName.name}-${pkgJson.version}`;
}

function parsePackageName(name: string): { namespace?: string; name: string } {
  const res = /^@([^/]+)\/(.+)/.exec(name);
  if (res == undefined) {
    return { name };
  }
  return { namespace: res[1], name: res[2] as string };
}
