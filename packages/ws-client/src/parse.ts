// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import Reader from "./Reader";
import Writer from "./Writer";
import { ClientMessage, ClientOpcode, ServerMessage, ServerOpcode } from "./types";

export function parseServerMessage(buffer: ArrayBuffer): ServerMessage {
  const reader = new Reader(buffer);

  const op = reader.uint8();
  switch (op as ServerOpcode) {
    case ServerOpcode.SERVER_INFO: {
      const id = reader.string();
      const capabilities = reader.array((r) => r.string());
      return { op, id, capabilities };
    }
    case ServerOpcode.STATUS_MESSAGE: {
      const level = Math.max(0, Math.min(reader.uint8(), 2)) as 0 | 1 | 2;
      const message = reader.string();
      return { op, level, message };
    }
    case ServerOpcode.CHANNEL_LIST: {
      const channels = reader.array((r) => {
        const topic = r.string();
        const encoding = r.string();
        const schemaName = r.string();
        const schema = r.string();
        return { topic, encoding, schemaName, schema };
      });
      return { op, channels };
    }

    case ServerOpcode.SUBSCRIPTION_ACK: {
      const subscriptions = reader.array((r) => {
        const clientSubscriptionId = r.uint32();
        const encoding = r.string();
        const schemaName = r.string();
        const schema = r.string();
        return { clientSubscriptionId, encoding, schemaName, schema };
      });
      return { op, subscriptions };
    }

    case ServerOpcode.MESSAGE_DATA: {
      const clientSubscriptionId = reader.uint32();
      const timestamp = reader.uint64();
      const data = new DataView(reader.buffer, reader.offset);
      return { op, clientSubscriptionId, timestamp, data };
    }
  }
  throw new Error(`Unrecognized server opcode: ${op.toString(16)}`);
}

export function serializeClientMessage(
  message: ClientMessage,
  scratchBuffer: ArrayBuffer,
): DataView {
  const writer = new Writer(scratchBuffer);
  writer.uint8(message.op);
  switch (message.op) {
    case ClientOpcode.LIST_CHANNELS: {
      break;
    }

    case ClientOpcode.SUBSCRIBE: {
      writer.array(message.subscriptions, (subscription, w) => {
        w.uint32(subscription.clientSubscriptionId);
        w.string(subscription.topic);
      });
      break;
    }

    case ClientOpcode.UNSUBSCRIBE: {
      writer.array(message.unsubscriptions, (val, w) => w.uint32(val));
      break;
    }
  }
  return new DataView(writer.buffer, 0, writer.offset);
}
