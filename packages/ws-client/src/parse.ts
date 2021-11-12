// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import Reader from "./Reader";
import { ServerMessage, ServerOpcode } from "./types";

export function parseServerMessage(buffer: ArrayBuffer): ServerMessage {
  const reader = new Reader(buffer);

  const op = reader.uint8();
  switch (op as ServerOpcode) {
    case ServerOpcode.SERVER_INFO:
    case ServerOpcode.STATUS_MESSAGE:
    case ServerOpcode.CHANNEL_LIST:
    case ServerOpcode.SUBSCRIPTION_ACK:
      throw new Error(`Opcode ${op} should be sent a JSON rather than binary`);

    case ServerOpcode.MESSAGE_DATA: {
      const clientSubscriptionId = reader.uint32();
      const timestamp = reader.uint64();
      const data = new DataView(reader.buffer, reader.offset);
      return { op, clientSubscriptionId, timestamp, data };
    }
  }
  throw new Error(`Unrecognized server opcode in binary message: ${op.toString(16)}`);
}
