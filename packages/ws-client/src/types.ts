// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

export enum ClientOpcode {
  LIST_CHANNELS = 0x02,
  SUBSCRIBE = 0x03,
  UNSUBSCRIBE = 0x04,
}

export enum ServerOpcode {
  SERVER_INFO = 0x80,
  STATUS_MESSAGE = 0x81,
  CHANNEL_LIST = 0x82,
  SUBSCRIPTION_ACK = 0x83,
  MESSAGE_DATA = 0x85,
}

export type ListChannels = {
  op: ClientOpcode.LIST_CHANNELS;
};
export type Subscribe = {
  op: ClientOpcode.SUBSCRIBE;
  subscriptions: Array<{
    clientSubscriptionId: number;
    topic: string;
  }>;
};
export type Unsubscribe = {
  op: ClientOpcode.UNSUBSCRIBE;
  unsubscriptions: number[];
};

export type ClientMessage = ListChannels | Subscribe | Unsubscribe;

export type ServerInfo = {
  op: ServerOpcode.SERVER_INFO;
  name: string;
  capabilities: string[];
};
export type StatusMessage = {
  op: ServerOpcode.STATUS_MESSAGE;
  level: 0 | 1 | 2;
  message: string;
};
export type ChannelList = {
  op: ServerOpcode.CHANNEL_LIST;
  channels: Array<{
    topic: string;
    encoding: string;
    schemaName: string;
    schema: string;
  }>;
};
export type SubscriptionAck = {
  op: ServerOpcode.SUBSCRIPTION_ACK;
  subscriptions: Array<{
    clientSubscriptionId: number;
    encoding: string;
    schemaName: string;
    schema: string;
  }>;
};
export type MessageData = {
  op: ServerOpcode.MESSAGE_DATA;
  clientSubscriptionId: number;
  timestamp: bigint;
  data: DataView;
};

export type ServerMessage =
  | ServerInfo
  | StatusMessage
  | ChannelList
  | SubscriptionAck
  | MessageData;
