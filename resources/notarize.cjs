const { notarize } = require("electron-notarize");
const builderUtil = require("builder-util");

exports.default = async function notarize(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== "darwin") {
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  const appPath = `${appOutDir}/${appName}.app`;

  const appleId = process.env.APPLE_ID;
  const applePassword = process.env.APPLE_PASSWORD;

  if (appleId === undefined || applePassword === undefined) {
    builderUtil.log.warn(
      {
        reason: "'APPLE_ID' or 'APPLE_PASSWORD' environment variables not set",
      },
      "skipped notarizing",
    );
    return;
  }

  builderUtil.log.info(
    {
      appPath: appPath,
      appleId: appleId,
    },
    "notarizing",
  );

  return await notarize({
    appBundleId: context.package.config.appId,
    appPath: appPath,
    appleId: appleId,
    appleIdPassword: applePassword,
  });
};
