// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
//
// This file incorporates work covered by the following copyright and
// permission notice:
//
//   Copyright 2019-2021 Cruise LLC
//
//   This source code is licensed under the Apache License, Version 2.0,
//   found at http://www.apache.org/licenses/LICENSE-2.0
//   You may not use this file except in compliance with the License.

import * as base64 from "@protobufjs/base64";
import protobufjs from "protobufjs";
import { FileDescriptorSet } from "protobufjs/ext/descriptor";
import { v4 as uuidv4 } from "uuid";

import Log from "@foxglove/log";
import { Time, fromMillis, fromNanoSec } from "@foxglove/rostime";
import PlayerProblemManager from "@foxglove/studio-base/players/PlayerProblemManager";
import {
  MessageEvent,
  Player,
  PlayerCapabilities,
  PlayerState,
  SubscribePayload,
  Topic,
  PlayerPresence,
  PlayerMetricsCollectorInterface,
  AdvertiseOptions,
} from "@foxglove/studio-base/players/types";
import { RosDatatypes } from "@foxglove/studio-base/types/RosDatatypes";
import debouncePromise from "@foxglove/studio-base/util/debouncePromise";
import { getTopicsByTopicName } from "@foxglove/studio-base/util/selectors";
import { TimestampMethod } from "@foxglove/studio-base/util/time";
import { Channel, FoxgloveClient } from "@foxglove/ws-protocol";

const log = Log.getLogger(__dirname);

const CAPABILITIES = [PlayerCapabilities.advertise];

export default class FoxgloveWebSocketPlayer implements Player {
  private _url: string; // WebSocket URL.
  private _client?: FoxgloveClient; // The roslibjs client when we're connected.
  private _id: string = uuidv4(); // Unique ID for this player.
  private _listener?: (arg0: PlayerState) => Promise<void>; // Listener for _emitState().
  private _closed: boolean = false; // Whether the player has been completely closed using close().
  private _topics?: Topic[]; // Topics as published by the WebSocket.
  private _datatypes?: RosDatatypes; // Datatypes as published by the WebSocket.
  private _start?: Time; // The time at which we started playing.
  private _topicSubscriptions = new Set<string>();
  private _parsedMessages: MessageEvent<unknown>[] = []; // Queue of messages that we'll send in next _emitState() call.
  private _messageOrder: TimestampMethod = "receiveTime";
  private _receivedBytes: number = 0;
  private _metricsCollector: PlayerMetricsCollectorInterface;
  private _hasReceivedMessage = false;
  private _presence: PlayerPresence = PlayerPresence.NOT_PRESENT;
  private _problems = new PlayerProblemManager();
  private _emitTimer?: ReturnType<typeof setTimeout>;

  constructor({
    url,
    metricsCollector,
  }: {
    url: string;
    metricsCollector: PlayerMetricsCollectorInterface;
  }) {
    this._presence = PlayerPresence.INITIALIZING;
    this._metricsCollector = metricsCollector;
    this._url = url;
    this._start = fromMillis(Date.now());
    this._metricsCollector.playerConstructed();
    this._open();
  }

  private _createDeserializer(channel: Channel) {
    try {
      if (channel.encoding !== "protobuf") {
        throw new Error(`Unsupported encoding ${channel.encoding}`);
      }
      const decodedSchema = new Uint8Array(base64.length(channel.schema));
      if (base64.decode(channel.schema, decodedSchema, 0) !== decodedSchema.byteLength) {
        throw new Error(`Failed to decode base64 schema on ${channel.topic}`);
      }
      const root = protobufjs.Root.fromDescriptor(FileDescriptorSet.decode(decodedSchema));
      const type = root.lookupType(channel.schemaName);
      return (data: ArrayBufferView) => {
        try {
          return type.decode(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
        } catch (error) {
          this._problems.addProblem(`message:${channel.topic}`, {
            severity: "error",
            message: `Failed to parse message on ${channel.topic}`,
            error,
          });
          this._emitState();
          throw error;
        }
      };
    } catch (error) {
      this._problems.addProblem(`schema:${channel.topic}`, {
        severity: "error",
        message: `Failed to parse channel schema on ${channel.topic}`,
        error,
      });
      this._emitState();
      throw error;
    }
  }

  private _open = (): void => {
    if (this._closed) {
      return;
    }
    if (this._client != undefined) {
      throw new Error(`Attempted to open a second Foxglove WebSocket connection`);
    }
    this._problems.removeProblem("ws:connection-failed");
    log.info(`Opening connection to ${this._url}`);

    const client = new FoxgloveClient({
      // url: this._url,
      ws: new WebSocket(this._url, [FoxgloveClient.SUPPORTED_SUBPROTOCOL]),
      createDeserializer: this._createDeserializer.bind(this),
    });

    client.on("open", () => {
      if (this._closed) {
        return;
      }
      this._presence = PlayerPresence.PRESENT;
      this._problems.removeProblem("ws:connection-failed");
      this._client = client;
    });

    client.on("channelListUpdate", (channels) => {
      this._topics = Array.from(channels.entries(), ([topic, channel]) => ({
        name: topic,
        datatype: channel.schemaName,
      }));
      this._datatypes = new Map(
        Array.from(channels.values(), (channel) => {
          return [channel.schemaName, { name: channel.schemaName, definitions: [] }];
        }),
      ); //FIXME
      this._emitState();
    });

    client.on("error", (err) => {
      this._problems.addProblem("ws:error", {
        severity: "warn",
        message: "Foxglove WebSocket error",
        error: err,
      });
      this._emitState();
    });

    client.on("message", ({ topic, timestamp, message, sizeInBytes }) => {
      if (!this._hasReceivedMessage) {
        this._hasReceivedMessage = true;
        this._metricsCollector.recordTimeToFirstMsgs();
      }
      this._parsedMessages.push({
        topic,
        receiveTime: fromNanoSec(timestamp),
        message,
        sizeInBytes,
      });
      this._emitState();
    });

    // client.on("close", () => {
    //   this._presence = PlayerPresence.RECONNECTING;

    //   if (this._requestTopicsTimeout) {
    //     clearTimeout(this._requestTopicsTimeout);
    //   }
    //   for (const [topicName, topic] of this._topicSubscriptions) {
    //     topic.unsubscribe();
    //     this._topicSubscriptions.delete(topicName);
    //   }
    //   client.close(); // ensure the underlying worker is cleaned up
    //   delete this._client;

    //   this._problems.addProblem("ws:connection-failed", {
    //     severity: "error",
    //     message: "Connection failed",
    //     tip: `Check that the rosbridge WebSocket server at ${this._url} is reachable.`,
    //   });

    //   this._emitState();

    //   // Try connecting again.
    //   setTimeout(this._open, 3000);
    // });
  };

  // Potentially performance-sensitive; await can be expensive
  // eslint-disable-next-line @typescript-eslint/promise-function-async
  private _emitState = debouncePromise(() => {
    if (!this._listener || this._closed) {
      return Promise.resolve();
    }

    const { _topics, _datatypes, _start } = this;
    if (!_topics || !_datatypes || !_start) {
      return this._listener({
        name: this._url,
        presence: this._presence,
        progress: {},
        capabilities: CAPABILITIES,
        playerId: this._id,
        activeData: undefined,
        problems: this._problems.problems(),
      });
    }

    // When connected
    // Time is always moving forward even if we don't get messages from the server.
    if (this._presence === PlayerPresence.PRESENT) {
      if (this._emitTimer != undefined) {
        clearTimeout(this._emitTimer);
      }
      this._emitTimer = setTimeout(this._emitState, 100);
    }

    const currentTime = this._getCurrentTime();
    const messages = this._parsedMessages;
    this._parsedMessages = [];
    return this._listener({
      name: this._url,
      presence: this._presence,
      progress: {},
      capabilities: CAPABILITIES,
      playerId: this._id,
      problems: this._problems.problems(),

      activeData: {
        messages,
        totalBytesReceived: this._receivedBytes,
        messageOrder: this._messageOrder,
        startTime: _start,
        endTime: currentTime,
        currentTime,
        isPlaying: true,
        speed: 1,
        // We don't support seeking, so we need to set this to any fixed value. Just avoid 0 so
        // that we don't accidentally hit falsy checks.
        lastSeekTime: 1,
        topics: _topics,
        datatypes: _datatypes,
        parsedMessageDefinitionsByTopic: {}, //FIXME
      },
    });
  });

  setListener(listener: (arg0: PlayerState) => Promise<void>): void {
    this._listener = listener;
    this._emitState();
  }

  close(): void {
    this._closed = true;
    if (this._client) {
      this._client.close();
    }
    if (this._emitTimer != undefined) {
      clearTimeout(this._emitTimer);
      this._emitTimer = undefined;
    }
    this._metricsCollector.close();
    this._hasReceivedMessage = false;
  }

  setSubscriptions(subscriptions: SubscribePayload[]): void {
    if (!this._client || this._closed) {
      return;
    }

    // See what topics we actually can subscribe to.
    const availableTopicsByTopicName = getTopicsByTopicName(this._topics ?? []);
    const topicNames = subscriptions
      .map(({ topic }) => topic)
      .filter((topicName) => availableTopicsByTopicName[topicName]);

    // Subscribe to all topics that we aren't subscribed to yet.
    for (const topicName of topicNames) {
      if (this._topicSubscriptions.has(topicName)) {
        continue;
      }
      this._client.subscribe(topicName);
      this._topicSubscriptions.add(topicName);
    }

    // Unsubscribe from topics that we are subscribed to but shouldn't be.
    for (const topicName of this._topicSubscriptions) {
      if (!topicNames.includes(topicName)) {
        this._client.unsubscribe(topicName);
        this._topicSubscriptions.delete(topicName);
      }
    }
  }

  setPublishers(publishers: AdvertiseOptions[]): void {
    if (publishers.length > 0) {
      throw new Error("Publishing is not supported by the Foxglove WebSocket connection");
    }
  }

  setParameter(): void {
    throw new Error("Parameter editing is not supported by the Foxglove WebSocket connection");
  }

  publish(): void {
    throw new Error("Publishing is not supported by the Foxglove WebSocket connection");
  }

  startPlayback(): void {
    throw new Error("Playback control is not supported by the Foxglove WebSocket connection");
  }
  pausePlayback(): void {
    throw new Error("Playback control is not supported by the Foxglove WebSocket connection");
  }
  seekPlayback(): void {
    throw new Error("Playback control is not supported by the Foxglove WebSocket connection");
  }
  setPlaybackSpeed(_speedFraction: number): void {}
  requestBackfill(): void {}
  setGlobalVariables(): void {}

  private _getCurrentTime(): Time {
    return fromMillis(Date.now());
  }
}
