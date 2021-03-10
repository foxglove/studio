// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
import exec from "./exec";

// Runs storybook in CI:
//  1. build storybook
//  2. capture screenshots (via storycap)
//  3. upload & compare screenshots (via reg-suit)

await exec("yarn", ["workspace", "@foxglove-studio/app", "run", "build-storybook"]);
await exec("yarn", [
  "workspace",
  "@foxglove-studio/app",
  "run",
  "storycap",
  "http://localhost:9001",

  // Use http-server instead of start-storybook since any build errors would be raised during
  // the build above, rather than waiting several minutes for it to build inside the storycap command
  "--serverCmd",
  "yarn http-server storybook-static -p 9001",

  "--outDir",
  "storybook-screenshots",

  "--puppeteerLaunchConfig",
  JSON.stringify({
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--user-agent=PuppeteerTestingChrome/88.",
    ],
  }),
]);

const publishArgs: string[] = [];

// If this is a PR, then by default github actions has us on a merge commit.
// Checkout the feature branch and commit to make reg-suit happy.
const prBranch = process.env.GITHUB_HEAD_REF ?? "";
if (prBranch.length > 0) {
  await exec("git", ["fetch", "origin", prBranch]);
  await exec("git", ["checkout", "-B", prBranch, `refs/remotes/origin/${prBranch}`]);
  // Only set GitHub status checks on PR branches, not main branch
  publishArgs.push("-n");
}

await exec("yarn", ["workspace", "@foxglove-studio/app", "run", "reg-suit", "sync-expected"]);
await exec("yarn", ["workspace", "@foxglove-studio/app", "run", "reg-suit", "compare"]);
await exec("yarn", [
  "workspace",
  "@foxglove-studio/app",
  "run",
  "reg-suit",
  "publish",
  ...publishArgs,
]);
