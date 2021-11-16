// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import WebSocket from "ws";

import Logger from "@foxglove/log";

import { parseServerMessage } from "./parse";
import {
  Channel,
  ClientMessage,
  ClientOpcode,
  ClientSubscriptionId,
  ServerMessage,
  ServerOpcode,
  Subscribe,
} from "./types";

const log = Logger.getLogger(__filename);

type OnMessageHandler = (event: {
  topic: string;
  timestamp: bigint;
  message: unknown;
  sizeInBytes: number;
}) => void;
type Deserializer = (data: DataView) => unknown;
type ResolvedSubscription = {
  id: ClientSubscriptionId;
  channel: Channel;
  deserializer: Deserializer;
};

export default class FoxgloveClient {
  static SUPPORTED_SUBPROTOCOL = "x-foxglove-1";

  private ws!: WebSocket;
  private url: string;
  private onMessage: OnMessageHandler;
  private createDeserializer: (channel: Channel) => Deserializer;
  private nextSubscriptionId = 0;
  private channelsByTopic = new Map<string, Channel>();

  private unresolvedSubscriptions = new Set<string>();
  private resolvedSubscriptionsByTopic = new Map<string, ResolvedSubscription>();
  private resolvedSubscriptionsById = new Map<ClientSubscriptionId, ResolvedSubscription>();

  constructor({
    url,
    createDeserializer,
    onMessage,
  }: {
    url: string;
    createDeserializer: (channel: Channel) => Deserializer;
    onMessage: OnMessageHandler;
  }) {
    this.url = url;
    this.createDeserializer = createDeserializer;
    this.onMessage = onMessage;
    this.reconnect();
  }

  private reconnect() {
    this.ws = new WebSocket(this.url, [FoxgloveClient.SUPPORTED_SUBPROTOCOL]);
    this.ws.binaryType = "arraybuffer";
    this.ws.onerror = (event) => {
      log.error("onerror", event.error);
    };
    this.ws.onopen = (_event) => {
      log.info("onopen");
      if (this.ws.protocol !== FoxgloveClient.SUPPORTED_SUBPROTOCOL) {
        throw new Error(
          `Expected subprotocol ${FoxgloveClient.SUPPORTED_SUBPROTOCOL}, got '${this.ws.protocol}'`,
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
          log.info("Received server info:", message);
          return;

        case ServerOpcode.STATUS_MESSAGE:
          log.info("Received status message:", message);
          return;

        case ServerOpcode.CHANNEL_LIST: {
          this.channelsByTopic.clear();
          for (const channel of message.channels) {
            if (this.channelsByTopic.has(channel.topic)) {
              log.error(
                `Duplicate channel for topic '${channel.topic}':`,
                this.channelsByTopic.get(channel.topic),
                channel,
              );
              throw new Error(`Duplicate channel for topic '${channel.topic}'`);
            }
            this.channelsByTopic.set(channel.topic, channel);
          }
          this.processUnresolvedSubscriptions();
          // TODO: what to do if a subscribed topic disappears and reappears with a different
          // schema?
          return;
        }

        case ServerOpcode.MESSAGE_DATA: {
          const sub = this.resolvedSubscriptionsById.get(message.clientSubscriptionId);
          if (!sub) {
            log.warn(`Received message for unknown subscription ${message.clientSubscriptionId}`);
            return;
          }
          this.onMessage({
            topic: sub.channel.topic,
            timestamp: message.timestamp,
            message: sub.deserializer(message.data),
            sizeInBytes: message.data.byteLength,
          });
          return;
        }
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

  subscribe(topic: string): void {
    this.unresolvedSubscriptions.add(topic);
    this.processUnresolvedSubscriptions();
  }

  unsubscribe(topic: string): void {
    this.unresolvedSubscriptions.delete(topic);
    const sub = this.resolvedSubscriptionsByTopic.get(topic);
    if (sub) {
      this.ws.send(this.serialize({ op: ClientOpcode.UNSUBSCRIBE, unsubscriptions: [sub.id] }));
      this.resolvedSubscriptionsById.delete(sub.id);
      this.resolvedSubscriptionsByTopic.delete(topic);
    }
  }

  /** Resolve subscriptions for which channels are known to be available */
  private processUnresolvedSubscriptions() {
    const subscriptions: Subscribe["subscriptions"] = [];
    for (const topic of [...this.unresolvedSubscriptions]) {
      const channel = this.channelsByTopic.get(topic);
      if (!channel) {
        return;
      }
      const id = this.nextSubscriptionId++;
      subscriptions.push({ clientSubscriptionId: id, channel: channel.id });
      const resolved = { id, channel, deserializer: this.createDeserializer(channel) };
      this.resolvedSubscriptionsByTopic.set(topic, resolved);
      this.resolvedSubscriptionsById.set(id, resolved);
      this.unresolvedSubscriptions.delete(topic);
    }
    if (subscriptions.length > 0) {
      this.ws.send(this.serialize({ op: ClientOpcode.SUBSCRIBE, subscriptions }));
    }
  }

  private serialize(message: ClientMessage): string {
    return JSON.stringify(message);
  }
}
