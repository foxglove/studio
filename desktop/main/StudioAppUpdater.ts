// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { captureException } from "@sentry/electron";
import { autoUpdater } from "electron-updater";

import Logger from "@foxglove/log";

const log = Logger.getLogger(__filename);

type AppUpdateMode = "none" | "default" | "start";

function isNetworkError(err: Error) {
  return (
    err.message === "net::ERR_INTERNET_DISCONNECTED" ||
    err.message === "net::ERR_PROXY_CONNECTION_FAILED" ||
    err.message === "net::ERR_CONNECTION_RESET" ||
    err.message === "net::ERR_CONNECTION_CLOSE" ||
    err.message === "net::ERR_NAME_NOT_RESOLVED" ||
    err.message === "net::ERR_CONNECTION_TIMED_OUT"
  );
}

class StudioAppUpdater {
  private updateMode: AppUpdateMode | undefined;

  // Seconds to wait after app startup to check and download updates.
  // This gives the user time to disable app updates for new installations
  private initialUpdateDelaySec = 60 * 10;

  // Seconds to wait after an update check completes before starting a new check
  private updateCheckIntervalSec = 60 * 60;

  /**
   * Start the update process.
   */
  start(updateMode: AppUpdateMode): void {
    if (updateMode === "none") {
      return;
    }

    if (this.updateMode != undefined) {
      throw new Error("Cannot start StudioAppUpdater again");
    }

    this.updateMode = updateMode;
    log.info(`Starting automatic updates with mode: ${this.updateMode}`);

    if (this.updateMode === "start") {
      this.checkForUpdatesAndNotify();
    } else {
      setTimeout(() => {
        this.checkForUpdatesAndNotify();
      }, this.initialUpdateDelaySec * 1000);
    }
  }

  // Check for updates and download.
  //
  // When using the "default" update mode, the app will continue to check for updates periodically
  private checkForUpdatesAndNotify(): void {
    log.info("Checking for updates");
    autoUpdater
      .checkForUpdatesAndNotify()
      .catch((err: Error) => {
        if (isNetworkError(err)) {
          log.warn(`Network error checking for updates: ${err}`);
        } else {
          captureException(err);
        }
      })
      .finally(() => {
        // Only the default mode has periodic checking for updates
        if (this.updateMode !== "default") {
          return;
        }
        setTimeout(() => {
          this.checkForUpdatesAndNotify();
        }, this.updateCheckIntervalSec * 1000);
      });
  }

  private static instance: StudioAppUpdater;
  static Instance(): StudioAppUpdater {
    return (StudioAppUpdater.instance ??= new StudioAppUpdater());
  }
}

export default StudioAppUpdater;
