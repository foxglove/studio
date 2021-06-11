// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

export type ExtensionPackageJson = { name: string; version: string; publisher?: string };

/**
 * Returns a unique identifier for an extension based on the publisher and package name. The
 * publisher can either be explicitly specified with a "publisher" field or extracted from the
 * "name" field if it contains a namespace such as "@foxglove".
 *
 * This method will throw if any required fields are missing or invalid.
 * @param pkgJson Parsed package.json file
 * @returns An identifier string such as "foxglove.studio-extension-turtlesim"
 */
export function getPackageId(pkgJson: ExtensionPackageJson): string {
  if (pkgJson == undefined) {
    throw new Error(`Missing package.json`);
  }

  if (typeof pkgJson.name !== "string") {
    throw new Error(`package.json is missing required "name" field`);
  }
  if (typeof pkgJson.version !== "string") {
    throw new Error(`package.json is missing required "version" field`);
  }

  const pkgName = parsePackageName(pkgJson.name);
  let publisher = pkgJson.publisher ?? pkgName.namespace;
  if (publisher == undefined) {
    throw new Error(`package.json is missing required "publisher" field`);
  }

  publisher = publisher.toLowerCase().replace(/\W+/g, "");
  if (publisher.length === 0) {
    throw new Error(`package.json contains an invalid "publisher" field`);
  }

  return `${publisher}.${pkgName.name}`;
}

/**
 * Get the directory name to use for an installed extension
 * @param pkgJson Parsed package.json file
 * @returns A directory name such as "foxglove.studio-extension-turtlesim-1.0.0"
 */
export function getPackageDirname(pkgJson: ExtensionPackageJson): string {
  const pkgId = getPackageId(pkgJson);
  const dir = `${pkgId}-${pkgJson.version}`;
  if (dir.length >= 255) {
    throw new Error(`package.json publisher.name-version is too long`);
  }
  return dir;
}

/**
 * Separate a package.json "name" field into separate namespace (i.e. @foxglove) and name fields
 * @param name The "name" field from a package.json file
 * @returns An object containing the unprefixed name and the namespace, if present
 */
export function parsePackageName(name: string): { namespace?: string; name: string } {
  const res = /^@([^/]+)\/(.+)/.exec(name);
  if (res == undefined) {
    return { name };
  }
  return { namespace: res[1], name: res[2] as string };
}
