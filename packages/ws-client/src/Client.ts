// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import WebSocket from "ws";

import Logger from "@foxglove/log";

import { parseServerMessage } from "./parse";
import { ClientMessage, ClientOpcode, ServerMessage, ServerOpcode } from "./types";

const log = Logger.getLogger(__filename);

export default class Client {
  static SUPPORTED_SUBPROTOCOL = "x-foxglove-1";

  private ws!: WebSocket;
  private url: string;
  private nextSubscriptionId = 0;

  constructor({ url }: { url: string }) {
    this.url = url;
    this.reconnect();
  }

  private reconnect() {
    this.ws = new WebSocket(this.url, [Client.SUPPORTED_SUBPROTOCOL]);
    this.ws.binaryType = "arraybuffer";
    this.ws.onerror = (event) => {
      log.error("onerror", event.error);
    };
    this.ws.onopen = (_event) => {
      log.info("onopen");
      if (this.ws.protocol !== Client.SUPPORTED_SUBPROTOCOL) {
        throw new Error(
          `Expected subprotocol ${Client.SUPPORTED_SUBPROTOCOL}, got '${this.ws.protocol}'`,
        );
      }
    };
    this.ws.onmessage = (event /*: MessageEvent<ArrayBuffer | string>*/) => {
      let message: ServerMessage;
      if (event.data instanceof ArrayBuffer) {
        message = parseServerMessage(event.data);
      } else {
        message = JSON.parse(event.data as string);
      }
      log.info("onmessage", message);

      switch (message.op) {
        case ServerOpcode.SERVER_INFO:
          return;
        case ServerOpcode.STATUS_MESSAGE:
          return;
        case ServerOpcode.CHANNEL_LIST:
          return;
        case ServerOpcode.SUBSCRIPTION_ACK:
          return;
        case ServerOpcode.MESSAGE_DATA:
          return;
      }
      throw new Error(`Unrecognized server opcode: ${(message as { op: unknown }).op}`);
    };
    this.ws.onclose = (event) => {
      log.error("onclose", { code: event.code, reason: event.reason, wasClean: event.wasClean });
    };
  }

  close(): void {
    this.ws.close();
  }

  subscribe(topic: string): () => void {
    const id = this.nextSubscriptionId++;
    this.ws.send(
      this.serialize({
        op: ClientOpcode.SUBSCRIBE,
        subscriptions: [{ clientSubscriptionId: id, topic }],
      }),
    );
    return () => {
      return this.ws.send(this.serialize({ op: ClientOpcode.UNSUBSCRIBE, unsubscriptions: [id] }));
    };
  }

  private serialize(message: ClientMessage): string {
    return JSON.stringify(message);
  }
}
