// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import Client from "../src/Client";

async function main() {
  const client = new Client({ url: "ws://localhost:8765" });
  void client;
  console.log("constructed client");
}

main().catch(console.error);
