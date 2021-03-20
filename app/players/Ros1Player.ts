// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { isEqual, sortBy, partition } from "lodash";
import { RosMsgDefinition, Time } from "rosbag";
import { v4 as uuidv4 } from "uuid";

import OsContextSingleton from "@foxglove-studio/app/OsContextSingleton";
import {
  AdvertisePayload,
  BobjectMessage,
  Message,
  Player,
  PlayerCapabilities,
  PlayerState,
  PublishPayload,
  SubscribePayload,
  Topic,
} from "@foxglove-studio/app/players/types";
import { RosDatatypes } from "@foxglove-studio/app/types/RosDatatypes";
import { wrapJsObject } from "@foxglove-studio/app/util/binaryObjects";
import debouncePromise from "@foxglove-studio/app/util/debouncePromise";
import { getTopicsByTopicName } from "@foxglove-studio/app/util/selectors";
import sendNotification from "@foxglove-studio/app/util/sendNotification";
import { fromMillis, TimestampMethod } from "@foxglove-studio/app/util/time";
import { Sockets } from "@foxglove/electron-socket/renderer";
import { RosNode, TcpSocket } from "@foxglove/ros1";
import { HttpServer } from "@foxglove/xmlrpc/src";

const capabilities = [PlayerCapabilities.advertise];
const NO_WARNINGS = Object.freeze({});

// Connects to `rosmaster` instance using `@foxglove/ros1`. Currently doesn't support seeking or
// showing simulated time, so current time from Date.now() is always used instead.
export default class Ros1Player implements Player {
  _url: string; // rosmaster URL.
  _rosNode?: RosNode; // Our ROS node when we're connected.
  _id: string = uuidv4(); // Unique ID for this player.
  _listener?: (arg0: PlayerState) => Promise<void>; // Listener for _emitState().
  _closed: boolean = false; // Whether the player has been completely closed using close().
  _providerTopics?: Topic[]; // Topics as advertised by rosmaster.
  _start?: Time; // The time at which we started playing.
  _requestedSubscriptions: SubscribePayload[] = []; // Requested subscriptions by setSubscriptions()
  _parsedMessages: Message[] = []; // Queue of messages that we'll send in next _emitState() call.
  _bobjects: BobjectMessage[] = []; // Queue of bobjects that we'll send in next _emitState() call.
  _messageOrder: TimestampMethod = "receiveTime";
  _requestTopicsTimeout?: ReturnType<typeof setTimeout>; // setTimeout() handle for _requestTopics().
  _bobjectTopics: Set<string> = new Set();
  _parsedTopics: Set<string> = new Set();

  constructor(url: string) {
    this._url = url;
    this._start = fromMillis(Date.now());
    this._open();
  }

  _open = async (): Promise<void> => {
    if (this._closed || OsContextSingleton == undefined) {
      return;
    }

    const net = await Sockets.Create();
    const httpServer = await net.createHttpServer();
    const tcpSocketCreate = (options: { host: string; port: number }): Promise<TcpSocket> => {
      return net.createSocket(options.host, options.port, "RosTcpMessageStream");
    };

    if (this._rosNode == undefined) {
      this._rosNode = new RosNode({
        name: "/foxglovestudio",
        hostname: OsContextSingleton.getHostnameForRos(),
        pid: OsContextSingleton.pid,
        rosMasterUri: this._url,
        httpServer: (httpServer as unknown) as HttpServer,
        tcpSocketCreate,
      });
    }

    await this._rosNode.start();
    this._requestTopics();
  };

  _requestTopics = async (): Promise<void> => {
    if (this._requestTopicsTimeout) {
      clearTimeout(this._requestTopicsTimeout);
    }
    const rosNode = this._rosNode;
    if (!rosNode || this._closed) {
      return;
    }

    try {
      const topicArrays = await rosNode.getPublishedTopics();
      const topics = topicArrays.map(([name, datatype]) => ({ name, datatype }));
      // Sort them for easy comparison. If nothing has changed here, bail out
      const sortedTopics: Topic[] = sortBy(topics, "name");
      if (isEqual(sortedTopics, this._providerTopics)) {
        return;
      }

      this._providerTopics = sortedTopics;

      // Try subscribing again, since we might now be able to subscribe to some new topics.
      this.setSubscriptions(this._requestedSubscriptions);
      this._emitState();
    } catch (error) {
      sendNotification("Error in fetching topics and datatypes", error, "app", "error");
    } finally {
      // Regardless of what happens, request topics again in a little bit.
      this._requestTopicsTimeout = setTimeout(this._requestTopics, 3000);
    }
  };

  _emitState = debouncePromise(() => {
    if (!this._listener || this._closed) {
      return Promise.resolve();
    }

    const { _providerTopics, _start } = this;
    if (!_providerTopics || !_start) {
      return this._listener({
        isPresent: true,
        showSpinner: true,
        showInitializing: !!this._rosNode,
        progress: {},
        capabilities,
        playerId: this._id,
        activeData: undefined,
      });
    }

    // Time is always moving forward even if we don't get messages from the server.
    setTimeout(this._emitState, 100);

    const currentTime = fromMillis(Date.now());
    const messages = this._parsedMessages;
    this._parsedMessages = [];
    const bobjects = this._bobjects;
    this._bobjects = [];
    return this._listener({
      isPresent: true,
      showSpinner: !this._rosNode,
      showInitializing: false,
      progress: {},
      capabilities,
      playerId: this._id,

      activeData: {
        messages,
        bobjects,
        totalBytesReceived: this._rosNode?.receivedBytes() ?? 0,
        messageOrder: this._messageOrder,
        startTime: _start,
        endTime: currentTime,
        currentTime,
        isPlaying: true,
        speed: 1,
        // We don't support seeking, so we need to set this to any fixed value. Just avoid 0 so
        // that we don't accidentally hit falsy checks.
        lastSeekTime: 1,
        topics: _providerTopics,
        datatypes: this.#getAllRosDatatypes(),
        parsedMessageDefinitionsByTopic: {},
        playerWarnings: NO_WARNINGS,
      },
    });
  });

  setListener(listener: (arg0: PlayerState) => Promise<void>): void {
    this._listener = listener;
    this._emitState();
  }

  close(): void {
    this._closed = true;
    if (this._rosNode) {
      this._rosNode.shutdown();
    }
  }

  setSubscriptions(subscriptions: SubscribePayload[]): void {
    this._requestedSubscriptions = subscriptions;

    if (!this._rosNode || this._closed) {
      return;
    }

    const [bobjectSubscriptions, parsedSubscriptions] = partition(
      subscriptions,
      ({ format }) => format === "bobjects",
    );
    this._bobjectTopics = new Set(bobjectSubscriptions.map(({ topic }) => topic));
    this._parsedTopics = new Set(parsedSubscriptions.map(({ topic }) => topic));

    // See what topics we actually can subscribe to.
    const availableTopicsByTopicName = getTopicsByTopicName(this._providerTopics ?? []);
    const topicNames = subscriptions
      .map(({ topic }) => topic)
      .filter((topicName) => availableTopicsByTopicName[topicName]);

    // Subscribe to all topics that we aren't subscribed to yet.
    for (const topicName of topicNames) {
      const availTopic = availableTopicsByTopicName[topicName];
      if (!availTopic || this._rosNode.subscriptions.has(topicName)) {
        continue;
      }

      const { datatype } = availTopic;
      const subscription = this._rosNode.subscribe({ topic: topicName, type: datatype });
      subscription.on("message", (message, _data, publisher) => {
        if (this._providerTopics == undefined) {
          return;
        }

        const receiveTime = fromMillis(Date.now());
        if (this._bobjectTopics.has(topicName)) {
          const msgdef = publisher.connection.messageDefinition();
          const typesByName = this.#getRosDatatypes(datatype, msgdef);
          this._bobjects.push({
            topic: topicName,
            receiveTime,
            message: wrapJsObject(typesByName, datatype, message),
          });
        }

        if (this._parsedTopics.has(topicName)) {
          this._parsedMessages.push({
            topic: topicName,
            receiveTime,
            message: message as never,
          });
        }

        this._emitState();
      });
    }

    // Unsubscribe from topics that we are subscribed to but shouldn't be.
    for (const topicName of this._rosNode.subscriptions.keys()) {
      if (!topicNames.includes(topicName)) {
        {
          this._rosNode.unsubscribe(topicName);
        }
      }
    }
  }

  setPublishers(publishers: AdvertisePayload[]): void {
    // TODO: Publishing
    if (publishers.length > 0) {
      const topics = publishers.map((p) => p.topic).join(", ");
      sendNotification(
        "Publishing not supported",
        `Cannot publish to "${topics}", ROS publishing is not supported yet`,
        "app",
        "error",
      );
    }
  }

  publish({ topic, msg }: PublishPayload): void {
    const publication = this._rosNode?.publications.get(topic);
    if (publication == undefined) {
      sendNotification(
        "Invalid publish call",
        `Tried to publish on a topic that is not registered as a publisher: ${topic}`,
        "app",
        "error",
      );
      return;
    }
    // TODO: Publishing
    <void>msg;
    // publication.publish(msg);
  }

  // Bunch of unsupported stuff. Just don't do anything for these.
  startPlayback(): void {
    // no-op
  }
  pausePlayback(): void {
    // no-op
  }
  seekPlayback(_time: Time): void {
    // no-op
  }
  setPlaybackSpeed(_speedFraction: number): void {
    // no-op
  }
  requestBackfill(): void {
    // no-op
  }
  setGlobalVariables(): void {
    // no-op
  }

  #getRosDatatypes = (datatype: string, messageDefinition: RosMsgDefinition[]): RosDatatypes => {
    const typesByName: RosDatatypes = {};
    messageDefinition.forEach(({ name, definitions }, index) => {
      // The first definition usually doesn't have an explicit name,
      // so we get the name from the connection.
      if (index === 0) {
        typesByName[datatype] = { fields: definitions };
      } else if (name != undefined) {
        typesByName[name] = { fields: definitions };
      }
    });
    return typesByName;
  };

  #getAllRosDatatypes = (): RosDatatypes => {
    const typesByName: RosDatatypes = {};
    if (this._rosNode == undefined) {
      return typesByName;
    }
    for (const sub of this._rosNode.subscriptions.values()) {
      for (const pub of sub.publishers().values()) {
        const msgdef = pub.connection.messageDefinition();
        Object.assign(typesByName, this.#getRosDatatypes(sub.dataType, msgdef));
      }
    }
    return typesByName;
  };
}
