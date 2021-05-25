// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { readdir, readFile, writeFile } from "fs/promises";
import mkdirp from "mkdirp";
import * as path from "path";
import sanitize from "sanitize-filename";

import { info } from "./log";

export interface CreateOptions {
  readonly name: string;
  readonly cwd?: string;
}

export async function createCommand(options: CreateOptions): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const name = options.name;
  const templateDir = path.join(__dirname, "..", "template");
  const extensionDir = path.join(cwd, name);

  if (name !== sanitize(name)) {
    throw new Error(
      `Name "${name}" contains invalid characters. Choose a filename-compatible project name`,
    );
  }

  const replacements = new Map([["${NAME}", name]]);
  const files = await listFiles(templateDir);
  for (const file of files) {
    const srcFile = path.resolve(templateDir, file);
    const dstFile = path.resolve(extensionDir, file);
    await copyTemplateFile(srcFile, dstFile, replacements);
  }

  info(`Created Foxglove Studio extension "${name}" at ${extensionDir}`);
}

async function listFiles(baseDir: string, curDir = "."): Promise<string[]> {
  let output: string[] = [];

  const dirname = path.join(baseDir, curDir);
  const contents = await readdir(dirname, { withFileTypes: true });
  for (const entry of contents) {
    if (entry.isDirectory()) {
      output = output.concat(await listFiles(baseDir, path.join(dirname, entry.name)));
    } else if (entry.isFile()) {
      output.push(path.relative(baseDir, path.join(dirname, entry.name)));
    }
  }

  return output;
}

async function copyTemplateFile(
  src: string,
  dst: string,
  replacements: Map<string, string>,
): Promise<void> {
  info(`creating ${dst}`);
  let contents = await readFile(src, { encoding: "utf8" });
  for (const [search, replacement] of replacements.entries()) {
    const regex = new RegExp(search.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"), "g");
    contents = contents.replace(regex, replacement);
  }
  await mkdirp(path.dirname(dst));
  await writeFile(dst, contents);
}
