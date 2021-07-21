// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { ArgumentParser, RawDescriptionHelpFormatter } from "argparse";
import { promises as fs } from "fs";
import path from "path";
import semver from "semver";

import { exec, execOutput } from "./exec";

type PackageJson = {
  version?: string;
};

enum Command {
  createBranch = "create-branch",
  bumpDev = "bump-dev",
  setVersion = "set-version",
}

class PrettyError extends Error {}

const REPO_ROOT = path.join(__dirname, "..");

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  switch (args.command as string) {
    case Command.createBranch:
      return await createBranchCommand(sanitizeVersion(args.version));
    case Command.bumpDev:
      return await bumpDevCommand();
    case Command.setVersion:
      return await setVersionCommand(sanitizeVersion(args.version));
  }
}

function parseArgs(args: string[]) {
  const parser = new ArgumentParser({
    formatter_class: RawDescriptionHelpFormatter,
    description: `
    Studio version and release management script.
  
    Commands:
      ${Command.createBranch}   Create release candidate branch and push to GitHub
      ${Command.bumpDev}        Create "Bump dev" commit on current branch
      ${Command.setVersion}     Set version number across all package.json files
    `.trim(),
  });
  const command_parser = parser.add_subparsers({ dest: "command", required: true });

  const create_command = command_parser.add_parser(Command.createBranch);
  create_command.add_argument("version", {
    type: String,
    help: "New version string",
  });

  command_parser.add_parser(Command.bumpDev);

  const version_command = command_parser.add_parser(Command.setVersion);
  version_command.add_argument("version", {
    type: String,
    help: "New version string",
  });

  // Show help if no args passed
  // First two argv are node interpreter and this script
  if (args.length === 0) {
    args.push("--help");
  }

  return parser.parse_args(args);
}

async function setVersionCommand(version: string): Promise<void> {
  await recursiveUpdatePackageVersion(REPO_ROOT, version);
}

function sanitizeVersion(version: string): string {
  const result = semver.valid(version);

  if (result == undefined) {
    throw new PrettyError(`Invalid version: ${version}`);
  }

  return result;
}

async function recursiveUpdatePackageVersion(dir: string, version: string): Promise<string[]> {
  const files = await fs.readdir(dir);
  const updatedFiles = new Array<string>();

  for (const file of files) {
    const fullPath = path.join(dir, file);

    if (file.startsWith(".") || file === "node_modules") {
      // don't recurse into hidden directories or node_modules
    } else if ((await fs.stat(fullPath)).isDirectory()) {
      // recurse into directory
      const moreUpdatedFiles = await recursiveUpdatePackageVersion(fullPath, version);
      updatedFiles.push(...moreUpdatedFiles);
    } else if (file === "package.json") {
      const pkg = JSON.parse(await fs.readFile(fullPath, "utf8")) as PackageJson;

      // if this package.json has a version field, update it
      if (pkg.version != undefined && pkg.version !== "") {
        pkg.version = version;
        await fs.writeFile(fullPath, JSON.stringify(pkg, undefined, 2) + "\n", "utf8");
        updatedFiles.push(fullPath);
        // eslint-disable-next-line no-restricted-syntax
        console.log(`Updated ${fullPath}`);
      }
    }
  }

  return updatedFiles;
}

async function createBranchCommand(version: string): Promise<void> {
  await requireCleanGitStatus();

  // create new release branch
  await exec("git", ["checkout", "main"]);
  await exec("git", ["fetch", "origin", "main"]);
  await exec("git", ["reset", "--hard", "origin/main"]);
  await exec("git", ["checkout", "-B", `release/v${version}`]);

  // create release commit
  await createReleaseCommit(version, `Release v${version}`);

  // push to github
  await exec("git", ["push", "--force", "--set-upstream", "origin", `release/v${version}`]);
}

async function createReleaseCommit(version: string, message: string) {
  // update package.json version
  const updatedFiles = await recursiveUpdatePackageVersion(REPO_ROOT, version);

  await exec("git", ["add", ...updatedFiles]);
  await exec("git", ["commit", "--message", message]);
}

async function bumpDevCommand(): Promise<void> {
  await requireCleanGitStatus();

  // get current package.json version
  const pkg = JSON.parse(
    await fs.readFile(path.join(REPO_ROOT, "package.json"), "utf8"),
  ) as PackageJson;

  const version = pkg.version ?? "";
  if (version.includes("-dev")) {
    // eslint-disable-next-line no-restricted-syntax
    console.log(`Current version already dev: ${version}`);
    return;
  }

  // update package.json version
  const updatedFiles = await recursiveUpdatePackageVersion(REPO_ROOT, `${version}-dev`);

  // create commit
  await exec("git", ["add", ...updatedFiles]);
  await exec("git", ["commit", "--message", "Bump dev"]);
}

async function requireCleanGitStatus(): Promise<void> {
  // fail if git status is not clean
  const status = await execOutput("git", ["status", "--porcelain"]);
  if (status !== "") {
    throw new PrettyError(
      `Git status is not clean, please fix before running this script.\n\n ${status}`,
    );
  }
}

if (require.main === module) {
  main().catch((e) => {
    if (e instanceof PrettyError) {
      // no stack trace for expected errors
      console.error(e.message);
    } else {
      // unexpected error
      console.error(e);
    }
    process.exit(1);
  });
}
