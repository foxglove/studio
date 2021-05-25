// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { ExtensionActivate } from "@foxglove/studio";

import { HelloPanel } from "./HelloPanel";

export const activate: ExtensionActivate = (ctx) => {
  ctx.registerPanel("hello-world", async () => HelloPanel);
};
