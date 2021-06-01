// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import Logger from "@foxglove/log";

const log = Logger.getLogger(__filename);

window.addEventListener("unhandledrejection", (event) => {
  console.warn(`UNHANDLED PROMISE REJECTION IN IFRAME: ${event.reason}`);
});

log.debug("initializing extension iframe");

console.log("window in iframe", window);
console.log((global as any).__studio);

const sample = (global as any).__studio;

async function run() {
  sample.foo();
}

run();
