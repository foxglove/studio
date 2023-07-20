// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { info } from "@actions/core";
import path from "path";
import tsUnusedExports from "ts-unused-exports";

// import { execOutput } from "./exec";

// Identify unused exports
//
// An export is considered unused if it is never imported in any source file.
//
// Note: use the "// ts-prune-ignore-next" comment above an export if you would like to mark it
// as used even though it appears unused. This might happen for exports which are injected via webpack.
async function main(): Promise<void> {
  const args = [
    String.raw`--ignoreFiles=\.stories\.tsx?$`,
    String.raw`--findCompletelyUnusedFiles`,
  ];
  const results = tsUnusedExports(
    path.join(__dirname, "../packages/studio-base/tsconfig.json"),
    args,
  );
  const repoRootPath = path.resolve(__dirname, "..");
  let hasUnusedExports = false;
  for (const [filePath, items] of Object.entries(results)) {
    if (filePath === "unusedFiles") {
      continue;
    }
    const pathFromRepoRoot = path.relative(repoRootPath, filePath);
    for (const item of items) {
      const message = `Unused export ${item.exportName}`;
      // In reality, sometimes item.location is undefined
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (item.location == undefined) {
        info(`::error file=${pathFromRepoRoot}::${message}`);
      } else {
        info(
          `::error file=${pathFromRepoRoot},line=${item.location.line},col=${item.location.character}::${message}`,
        );
      }
      hasUnusedExports = true;
    }
  }

  for (const filePath of results.unusedFiles ?? []) {
    const pathFromRepoRoot = path.relative(repoRootPath, filePath);
    info(`::error file=${pathFromRepoRoot}::Unused file`);
    hasUnusedExports = true;
  }

  // const { stdout, status } = await execOutput(
  //   "ts-prune",
  //   [
  //     "-p",
  //     "packages/studio-base/tsconfig.json",
  //     "--error",
  //     "--ignore",
  //     [
  //       String.raw`used in module`,
  //       String.raw`^packages/(hooks|den|mcap|mcap-support)/`,
  //       String.raw`/studio/src/index\.ts`,
  //       String.raw`/studio-base/src/index\.ts`,
  //       String.raw`/studio-base/src/stories/`,
  //       String.raw`/studio-base/src/test/`,
  //       String.raw`/studio-base/src/i18n/`, // Doesn't work due to use of `export *` & `import *`
  //       String.raw`/ThreeDeeRender/transforms/index\.ts`,
  //       String.raw`/nodeTransformerWorker/typescript/userUtils`,
  //       String.raw`\.stories\.ts`,
  //       String.raw`/\.storybook/|/storySupport/`,
  //     ].join("|"),

  //     // --skip means don't consider exports used if they are only used in these files
  //     "--skip",
  //     String.raw`\.test\.ts|\.stories\.tsx`,
  //   ],
  //   { ignoreReturnCode: true },
  // );
  process.exit(hasUnusedExports ? 1 : 0);
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
