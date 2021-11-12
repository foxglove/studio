// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { EventEmitter } from "eventemitter3";

import { parseServerMessage, serializeClientMessage } from "./parse";
import { ClientMessage, ClientOpcode } from "./types";

export default class Client {
  static SUPPORTED_SUBPROTOCOL = "x-foxglove-1";

  private ws!: WebSocket;
  private url: string;
  private nextSubscriptionId = 0;
  private scratchBuffer = new ArrayBuffer(4096);

  constructor({ url }: { url: string }) {
    this.url = url;
    this.reconnect();
  }

  private reconnect() {
    this.ws = new WebSocket(this.url, [Client.SUPPORTED_SUBPROTOCOL]);
    this.ws.binaryType = "arraybuffer";
    this.ws.onerror = (event) => {};
    this.ws.onopen = (event) => {
      if (this.ws.protocol !== Client.SUPPORTED_SUBPROTOCOL) {
        throw new Error(
          `Expected subprotocol ${Client.SUPPORTED_SUBPROTOCOL}, got '${this.ws.protocol}'`,
        );
      }
    };
    this.ws.onmessage = (event: MessageEvent<ArrayBuffer | string>) => {
      if (event.data instanceof ArrayBuffer) {
        const message = parseServerMessage(event.data);
      }
    };
    this.ws.onclose = (event) => {};
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

  serialize(message: ClientMessage): DataView {
    const view = serializeClientMessage(message, this.scratchBuffer);
    this.scratchBuffer = view.buffer;
    return view;
  }
}
