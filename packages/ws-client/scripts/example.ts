// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import path from "path";
import protobufjs from "protobufjs";
import { FileDescriptorSet } from "protobufjs/ext/descriptor";

import FoxgloveClient from "../src/FoxgloveClient";

async function main() {
  const [, , host, topic] = process.argv;
  if (!host || !topic) {
    throw new Error(`Usage: ${path.basename(__filename)} [host] [topic]`);
  }
  const client = new FoxgloveClient({
    url: `ws://${host}:8765`,
    onMessage: console.log,
    createDeserializer: (channel) => {
      if (channel.encoding !== "protobuf") {
        throw new Error(`Unsupported encoding ${channel.encoding}`);
      }
      const root = protobufjs.Root.fromDescriptor(
        FileDescriptorSet.decode(Buffer.from(channel.schema, "base64")),
      );
      const type = root.lookupType(channel.schemaName);
      return (data) => type.decode(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
    },
  });
  client.subscribe(topic);
}

main().catch(console.error);
