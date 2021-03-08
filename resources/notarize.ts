<<<<<<< HEAD:resources/notarize.cjs
version https://git-lfs.github.com/spec/v1
oid sha256:48c6add77f266cd1652ea063c6018202524604f87b1fd1d7bc29c6701eb010cf
size 1173
=======
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
import { log } from "builder-util";
import type { AfterPackContext } from "electron-builder";
import { notarize } from "electron-notarize";

exports.default = async function (context: AfterPackContext) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== "darwin") {
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  const appPath = `${appOutDir}/${appName}.app`;

  const appId = context.packager.config.appId;
  const appleId = process.env.APPLE_ID;
  const applePassword = process.env.APPLE_PASSWORD;

  if (appId === undefined || appId === null) {
    log.warn(
      {
        reason: "'appId' missing from builder config",
      },
      "skipped notarizing",
    );
    return;
  }

  if (appleId === undefined || applePassword === undefined) {
    log.warn(
      {
        reason: "'APPLE_ID' or 'APPLE_PASSWORD' environment variables not set",
      },
      "skipped notarizing",
    );
    return;
  }

  log.info(
    {
      appPath: appPath,
      appleId: appleId,
    },
    "notarizing",
  );

  return notarize({
    appBundleId: appId,
    appPath: appPath,
    appleId: appleId,
    appleIdPassword: applePassword,
  });
};
>>>>>>> 11d2b87 (typescriptify notarize.ts):resources/notarize.ts
