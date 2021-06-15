// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import electronPath from "electron";
import path from "path";
import { _electron as electron } from "playwright";

(async () => {
  const appPath = path.join(__dirname, "..", ".webpack");

  // In node.js the electron import gives us the path to the electron binary
  // Our type definitions don't realize this so cast the variable to a string
  const electronApp = await electron.launch({
    args: [appPath],
    executablePath: electronPath as unknown as string,
  });

  // Evaluation expression in the Electron context.
  /*
  const appPath = await electronApp.evaluate(async ({ app }) => {
    // This runs in the main Electron process, parameter here is always
    // the result of the require('electron') in the main app script.
    return app.getAppPath();
  });
  console.log(appPath);
  */

  // Get the first window that the app opens, wait if necessary.
  const electronWindow = await electronApp.firstWindow();

  // Direct Electron console to Node terminal.
  await new Promise<void>((resolve, reject) => {
    electronWindow.on("console", (message) => {
      if (message.type() === "error") {
        reject(new Error(message.text()));
        return;
      }
      console.log(message.text());

      if (message.text().includes("App rendered")) {
        resolve();
      }
    });
  });

  // Capture a screenshot.
  await electronWindow.screenshot({ path: "intro.png" });
  // Click button.
  // Exit app.
  await electronApp.close();
  console.log("done");
})();
