import electronPath from "electron";
import { ConsoleMessage, _electron as electron, ElectronApplication, Page } from "playwright";
import { appPath } from "./build";
import { mkdtemp } from "fs/promises";
import * as os from "os";
import * as path from "path";

import Logger from "@foxglove/log";
import { signal } from "@foxglove/den/async";

(Symbol as any).dispose ??= Symbol("Symbol.dispose");
(Symbol as any).asyncDispose ??= Symbol("Symbol.asyncDispose");

const log = Logger.getLogger(__filename);

/**
 * Launch the app and wait for initial render.
 *
 * @returns An AsyncDisposable which automatically closes the app when it goes out of scope.
 */
export async function launchApp(): Promise<
  {
    main: ElectronApplication;
    renderer: Page;
  } & AsyncDisposable
> {
  // Create a new user data directory for each test, which bypasses the `app.requestSingleInstanceLock()`
  const userDataDir = await mkdtemp(path.join(os.tmpdir(), "integration-test-"));
  const electronApp = await electron.launch({
    args: [appPath, "--user-data-dir", userDataDir],
    // In node.js the electron import gives us the path to the electron binary
    // Our type definitions don't realize this so cast the variable to a string
    executablePath: electronPath as unknown as string,
  });

  const electronWindow = await electronApp.firstWindow();
  const appRendered = signal();
  electronWindow.on("console", (message: ConsoleMessage) => {
    if (message.type() === "error") {
      fail(new Error(message.text()));
    }
    log.info(message.text());

    if (message.text().includes("App rendered")) {
      console.log("resolving render!");
      // Wait for a few seconds for the app to render more components and detect if
      // there are any errors after the initial app render
      setTimeout(() => appRendered.resolve(), 2_000);
    }
  });

  await appRendered;

  return {
    main: electronApp,
    renderer: electronWindow,

    async [Symbol.asyncDispose]() {
      await electronApp.close();
    },
  };
}
