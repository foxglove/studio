// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import path from "path";
import { Application } from "spectron";

jest.setTimeout(20000);

const electronPath = path.join(__dirname, "..", "node_modules", ".bin", "electron");
const appPath = path.join(__dirname, "..", ".webpack");

const app = new Application({
  path: electronPath,
  args: [appPath],
});

beforeAll(async () => {
  await app.start();
});

afterAll(async () => {
  if (!app.isRunning()) {
    return;
  }

  await app.stop();
  expect(app.isRunning()).toBe(false);
});

async function waitForAppMounted(appInstance: Application) {
  for (;;) {
    const logs = await appInstance.client.getRenderProcessLogs();
    for (const log of logs as { level: "INFO" | "SEVERE" | "WARNING"; message?: string }[]) {
      if (log.level === "SEVERE") {
        throw new Error(log.message);
      }
      const message = log.message;
      if (typeof message === "string" && message.includes("App rendered")) {
        return;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

it("should start with no errors", async () => {
  await waitForAppMounted(app);
});
