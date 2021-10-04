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

import { isEqual, sortBy } from "lodash";
import roslib from "roslib";
import { v4 as uuidv4 } from "uuid";

import Log from "@foxglove/log";
import type { RosGraph } from "@foxglove/ros1";
import { parse as parseMessageDefinition } from "@foxglove/rosmsg";
import { LazyMessageReader } from "@foxglove/rosmsg-serialization";
import { MessageReader as ROS2MessageReader } from "@foxglove/rosmsg2-serialization";
import {
  Time,
  add as addTimes,
  fromMillis,
  subtract as subtractTimes,
  toSec,
} from "@foxglove/rostime";
import PlayerProblemManager from "@foxglove/studio-base/players/PlayerProblemManager";
import {
  AdvertiseOptions,
  MessageEvent,
  Player,
  PlayerCapabilities,
  PlayerState,
  PublishPayload,
  SubscribePayload,
  Topic,
  ParsedMessageDefinitionsByTopic,
  PlayerPresence,
  PlayerMetricsCollectorInterface,
  ParameterValue,
} from "@foxglove/studio-base/players/types";
import { RosDatatypes } from "@foxglove/studio-base/types/RosDatatypes";
import { bagConnectionsToDatatypes } from "@foxglove/studio-base/util/bagConnectionsHelper";
import debouncePromise from "@foxglove/studio-base/util/debouncePromise";
import { getTopicsByTopicName } from "@foxglove/studio-base/util/selectors";
import { TimestampMethod } from "@foxglove/studio-base/util/time";

const log = Log.getLogger(__dirname);

const CAPABILITIES = [PlayerCapabilities.advertise];

// Connects to `rosbridge_server` instance using `roslibjs`. Currently doesn't support seeking or
// showing simulated time, so current time from Date.now() is always used instead. Also doesn't yet
// support raw ROS messages; instead we use the CBOR compression provided by roslibjs, which
// unmarshalls into plain JS objects.
export default class RosbridgePlayer implements Player {
  #url: string; // WebSocket URL.
  #rosClient?: roslib.Ros; // The roslibjs client when we're connected.
  #id: string = uuidv4(); // Unique ID for this player.
  #listener?: (arg0: PlayerState) => Promise<void>; // Listener for _emitState().
  #closed: boolean = false; // Whether the player has been completely closed using close().
  #providerTopics?: Topic[]; // Topics as published by the WebSocket.
  #providerDatatypes?: RosDatatypes; // Datatypes as published by the WebSocket.
  #publishedTopics = new Map<string, Set<string>>(); // A map of topic names to the set of publisher IDs publishing each topic.
  #subscribedTopics = new Map<string, Set<string>>(); // A map of topic names to the set of subscriber IDs subscribed to each topic.
  #services = new Map<string, Set<string>>(); // A map of service names to service provider IDs that provide each service.
  #messageReadersByDatatype: {
    [datatype: string]: LazyMessageReader | ROS2MessageReader;
  } = {};
  #start?: Time; // The time at which we started playing.
  #clockTime?: Time; // The most recent published `/clock` time, if available
  #clockReceived: Time = { sec: 0, nsec: 0 }; // The local time when `_clockTime` was last received
  // active subscriptions
  #topicSubscriptions = new Map<string, roslib.Topic>();
  #requestedSubscriptions: SubscribePayload[] = []; // Requested subscriptions by setSubscriptions()
  #parsedMessages: MessageEvent<unknown>[] = []; // Queue of messages that we'll send in next _emitState() call.
  #messageOrder: TimestampMethod = "receiveTime";
  #requestTopicsTimeout?: ReturnType<typeof setTimeout>; // setTimeout() handle for _requestTopics().
  // active publishers for the current connection
  #topicPublishers = new Map<string, roslib.Topic>();
  // which topics we want to advertise to other nodes
  #advertisements: AdvertiseOptions[] = [];
  #parsedMessageDefinitionsByTopic: ParsedMessageDefinitionsByTopic = {};
  #parsedTopics: Set<string> = new Set();
  #receivedBytes: number = 0;
  #metricsCollector: PlayerMetricsCollectorInterface;
  #hasReceivedMessage = false;
  #presence: PlayerPresence = PlayerPresence.NOT_PRESENT;
  #problems = new PlayerProblemManager();
  #emitTimer?: ReturnType<typeof setTimeout>;

  constructor({
    url,
    metricsCollector,
  }: {
    url: string;
    metricsCollector: PlayerMetricsCollectorInterface;
  }) {
    this.#presence = PlayerPresence.INITIALIZING;
    this.#metricsCollector = metricsCollector;
    this.#url = url;
    this.#start = fromMillis(Date.now());
    this.#metricsCollector.playerConstructed();
    this.#open();
  }

  #open = (): void => {
    if (this.#closed) {
      return;
    }
    if (this.#rosClient != undefined) {
      throw new Error(`Attempted to open a second Rosbridge connection`);
    }
    this.#problems.removeProblem("rosbridge:connection-failed");
    log.info(`Opening connection to ${this.#url}`);

    // `workersocket` will open the actual WebSocket connection in a WebWorker.
    const rosClient = new roslib.Ros({ url: this.#url, transportLibrary: "workersocket" });

    rosClient.on("connection", () => {
      if (this.#closed) {
        return;
      }
      this.#presence = PlayerPresence.PRESENT;
      this.#problems.removeProblem("rosbridge:connection-failed");
      this.#rosClient = rosClient;

      this._setupPublishers();
      void this.#requestTopics();
    });

    rosClient.on("error", (err) => {
      if (err) {
        this.#problems.addProblem("rosbridge:error", {
          severity: "warn",
          message: "Rosbridge error",
          error: err,
        });
        this.#emitState();
      }
    });

    rosClient.on("close", () => {
      this.#presence = PlayerPresence.RECONNECTING;

      if (this.#requestTopicsTimeout) {
        clearTimeout(this.#requestTopicsTimeout);
      }
      for (const [topicName, topic] of this.#topicSubscriptions) {
        topic.unsubscribe();
        this.#topicSubscriptions.delete(topicName);
      }
      rosClient.close(); // ensure the underlying worker is cleaned up
      this.#rosClient = undefined;

      this.#problems.addProblem("rosbridge:connection-failed", {
        severity: "error",
        message: "Connection failed",
        tip: `Check that the rosbridge WebSocket server at ${this.#url} is reachable.`,
      });

      this.#emitState();

      // Try connecting again.
      setTimeout(this.#open, 3000);
    });
  };

  #requestTopics = async (): Promise<void> => {
    // clear problems before each topics request so we don't have stale problems from previous failed requests
    this.#problems.removeProblems((id) => id.startsWith("requestTopics:"));

    if (this.#requestTopicsTimeout) {
      clearTimeout(this.#requestTopicsTimeout);
    }
    const rosClient = this.#rosClient;
    if (!rosClient || this.#closed) {
      return;
    }

    try {
      const result = await new Promise<{
        topics: string[];
        types: string[];
        typedefs_full_text: string[];
      }>((resolve, reject) => rosClient.getTopicsAndRawTypes(resolve, reject));

      const topicsMissingDatatypes: string[] = [];
      const topics = [];
      const datatypeDescriptions = [];
      const messageReaders: Record<string, LazyMessageReader | ROS2MessageReader> = {};

      // Automatically detect the ROS version based on the datatypes.
      // The rosbridge server itself publishes /rosout so the topic should be reliably present.
      let rosVersion: 1 | 2;
      if (result.types.includes("rcl_interfaces/msg/Log")) {
        rosVersion = 2;
        this.#problems.removeProblem("unknownRosVersion");
      } else if (result.types.includes("rosgraph_msgs/Log")) {
        rosVersion = 1;
        this.#problems.removeProblem("unknownRosVersion");
      } else {
        rosVersion = 1;
        this.#problems.addProblem("unknownRosVersion", {
          severity: "warn",
          message: "Unable to detect ROS version, assuming ROS 1",
        });
      }

      for (let i = 0; i < result.topics.length; i++) {
        const topicName = result.topics[i]!;
        const type = result.types[i];
        const messageDefinition = result.typedefs_full_text[i];

        if (type == undefined || messageDefinition == undefined) {
          topicsMissingDatatypes.push(topicName);
          continue;
        }
        topics.push({ name: topicName, datatype: type });
        datatypeDescriptions.push({ type, messageDefinition });
        const parsedDefinition = parseMessageDefinition(messageDefinition, {
          ros2: rosVersion === 2,
        });
        messageReaders[type] ??=
          rosVersion === 1
            ? new LazyMessageReader(parsedDefinition)
            : new ROS2MessageReader(parsedDefinition);
        this.#parsedMessageDefinitionsByTopic[topicName] = parsedDefinition;
      }

      // Sort them for easy comparison. If nothing has changed here, bail out.
      const sortedTopics = sortBy(topics, "name");
      if (isEqual(sortedTopics, this.#providerTopics)) {
        return;
      }

      if (topicsMissingDatatypes.length > 0) {
        this.#problems.addProblem("requestTopics:missing-types", {
          severity: "warn",
          message: "Could not resolve all message types",
          tip: `Message types could not be found for these topics: ${topicsMissingDatatypes.join(
            ",",
          )}`,
        });
      }

      if (this.#providerTopics == undefined) {
        this.#metricsCollector.initialized();
      }

      this.#providerTopics = sortedTopics;
      this.#providerDatatypes = bagConnectionsToDatatypes(datatypeDescriptions, {
        ros2: rosVersion === 2,
      });
      this.#messageReadersByDatatype = messageReaders;

      // Try subscribing again, since we might now be able to subscribe to some new topics.
      this.setSubscriptions(this.#requestedSubscriptions);

      // Fetch the full graph topology
      try {
        const graph = await this._getSystemState();
        this.#publishedTopics = graph.publishers;
        this.#subscribedTopics = graph.subscribers;
        this.#services = graph.services;
      } catch (error) {
        this.#problems.addProblem("requestTopics:system-state", {
          severity: "error",
          message: "Failed to fetch node details from rosbridge",
          error,
        });
        this.#publishedTopics = new Map();
        this.#subscribedTopics = new Map();
        this.#services = new Map();
      }
    } catch (error) {
      this.#problems.addProblem("requestTopics:error", {
        severity: "error",
        message: "Failed to fetch topics from rosbridge",
        error,
      });
    } finally {
      this.#emitState();

      // Regardless of what happens, request topics again in a little bit.
      this.#requestTopicsTimeout = setTimeout(this.#requestTopics, 3000);
    }
  };

  // Potentially performance-sensitive; await can be expensive
  // eslint-disable-next-line @typescript-eslint/promise-function-async
  #emitState = debouncePromise(() => {
    if (!this.#listener || this.#closed) {
      return Promise.resolve();
    }

    if (!this.#providerTopics || !this.#providerDatatypes || !this.#start) {
      return this.#listener({
        name: this.#url,
        presence: this.#presence,
        progress: {},
        capabilities: CAPABILITIES,
        playerId: this.#id,
        activeData: undefined,
        problems: this.#problems.problems(),
      });
    }

    // When connected
    // Time is always moving forward even if we don't get messages from the server.
    if (this.#presence === PlayerPresence.PRESENT) {
      if (this.#emitTimer != undefined) {
        clearTimeout(this.#emitTimer);
      }
      this.#emitTimer = setTimeout(this.#emitState, 100);
    }

    const currentTime = this._getCurrentTime();
    const messages = this.#parsedMessages;
    this.#parsedMessages = [];
    return this.#listener({
      name: this.#url,
      presence: this.#presence,
      progress: {},
      capabilities: CAPABILITIES,
      playerId: this.#id,
      problems: this.#problems.problems(),

      activeData: {
        messages,
        totalBytesReceived: this.#receivedBytes,
        messageOrder: this.#messageOrder,
        startTime: this.#start,
        endTime: currentTime,
        currentTime,
        isPlaying: true,
        speed: 1,
        // We don't support seeking, so we need to set this to any fixed value. Just avoid 0 so
        // that we don't accidentally hit falsy checks.
        lastSeekTime: 1,
        topics: this.#providerTopics,
        datatypes: this.#providerDatatypes,
        publishedTopics: this.#publishedTopics,
        subscribedTopics: this.#subscribedTopics,
        services: this.#services,
        parsedMessageDefinitionsByTopic: this.#parsedMessageDefinitionsByTopic,
      },
    });
  });

  setListener(listener: (arg0: PlayerState) => Promise<void>): void {
    this.#listener = listener;
    this.#emitState();
  }

  close(): void {
    this.#closed = true;
    if (this.#rosClient) {
      this.#rosClient.close();
    }
    if (this.#emitTimer != undefined) {
      clearTimeout(this.#emitTimer);
      this.#emitTimer = undefined;
    }
    this.#metricsCollector.close();
    this.#hasReceivedMessage = false;
  }

  setSubscriptions(subscriptions: SubscribePayload[]): void {
    this.#requestedSubscriptions = subscriptions;

    if (!this.#rosClient || this.#closed) {
      return;
    }

    // Subscribe to additional topics used by Ros1Player itself
    this._addInternalSubscriptions(subscriptions);

    this.#parsedTopics = new Set(subscriptions.map(({ topic }) => topic));

    // See what topics we actually can subscribe to.
    const availableTopicsByTopicName = getTopicsByTopicName(this.#providerTopics ?? []);
    const topicNames = subscriptions
      .map(({ topic }) => topic)
      .filter((topicName) => availableTopicsByTopicName[topicName]);

    // Subscribe to all topics that we aren't subscribed to yet.
    for (const topicName of topicNames) {
      if (this.#topicSubscriptions.has(topicName)) {
        continue;
      }
      const topic = new roslib.Topic({
        ros: this.#rosClient,
        name: topicName,
        compression: "cbor-raw",
      });
      const availTopic = availableTopicsByTopicName[topicName];
      if (!availTopic) {
        continue;
      }

      const { datatype } = availTopic;
      const messageReader = this.#messageReadersByDatatype[datatype];
      if (!messageReader) {
        continue;
      }

      const problemId = `message:${topicName}`;
      topic.subscribe((message) => {
        if (!this.#providerTopics) {
          return;
        }
        try {
          const receiveTime = fromMillis(Date.now());
          const buffer = (message as { bytes: ArrayBuffer }).bytes;
          const bytes = new Uint8Array(buffer);

          // This conditional can be removed when the ROS2 deserializer supports size()
          if (messageReader instanceof LazyMessageReader) {
            const msgSize = messageReader.size(bytes);
            if (msgSize > bytes.byteLength) {
              this.#problems.addProblem(problemId, {
                severity: "error",
                message: `Message buffer not large enough on ${topicName}`,
                error: new Error(
                  `Cannot read ${msgSize} byte message from ${bytes.byteLength} byte buffer`,
                ),
              });
              this.#emitState();
              return;
            }
          }

          const innerMessage = messageReader.readMessage(bytes);

          if (!this.#hasReceivedMessage) {
            this.#hasReceivedMessage = true;
            this.#metricsCollector.recordTimeToFirstMsgs();
          }

          if (this.#parsedTopics.has(topicName)) {
            const msg: MessageEvent<unknown> = {
              topic: topicName,
              receiveTime,
              message: innerMessage,
            };
            this.#parsedMessages.push(msg);
            this._handleInternalMessage(msg);
          }
          this.#problems.removeProblem(problemId);
        } catch (error) {
          this.#problems.addProblem(problemId, {
            severity: "error",
            message: `Failed to parse message on ${topicName}`,
            error,
          });
        }

        this.#emitState();
      });
      this.#topicSubscriptions.set(topicName, topic);
    }

    // Unsubscribe from topics that we are subscribed to but shouldn't be.
    for (const [topicName, topic] of this.#topicSubscriptions) {
      if (!topicNames.includes(topicName)) {
        topic.unsubscribe();
        this.#topicSubscriptions.delete(topicName);
      }
    }
  }

  setPublishers(publishers: AdvertiseOptions[]): void {
    // Since `setPublishers` is rarely called, we can get away with just throwing away the old
    // Roslib.Topic objects and creating new ones.
    for (const publisher of this.#topicPublishers.values()) {
      publisher.unadvertise();
    }
    this.#topicPublishers.clear();
    this.#advertisements = publishers;
    this._setupPublishers();
  }

  setParameter(_key: string, _value: ParameterValue): void {
    throw new Error("Parameter editing is not supported by the Rosbridge connection");
  }

  publish({ topic, msg }: PublishPayload): void {
    const publisher = this.#topicPublishers.get(topic);
    if (!publisher) {
      throw new Error(
        `Tried to publish on a topic that is not registered as a publisher: ${topic}`,
      );
    }
    publisher.publish(msg);
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

  private _setupPublishers(): void {
    // This function will be called again once a connection is established
    if (!this.#rosClient) {
      return;
    }

    if (this.#advertisements.length <= 0) {
      return;
    }

    for (const { topic, datatype } of this.#advertisements) {
      this.#topicPublishers.set(
        topic,
        new roslib.Topic({
          ros: this.#rosClient,
          name: topic,
          messageType: datatype,
          queue_size: 0,
        }),
      );
    }
  }

  private _addInternalSubscriptions(subscriptions: SubscribePayload[]): void {
    // Always subscribe to /clock if available
    if (subscriptions.find((sub) => sub.topic === "/clock") == undefined) {
      subscriptions.unshift({
        topic: "/clock",
        requester: { type: "other", name: "Ros1Player" },
      });
    }
  }

  private _handleInternalMessage(msg: MessageEvent<unknown>): void {
    const maybeClockMsg = msg.message as { clock?: Time };

    if (msg.topic === "/clock" && maybeClockMsg.clock && !isNaN(maybeClockMsg.clock?.sec)) {
      const time = maybeClockMsg.clock;
      const seconds = toSec(maybeClockMsg.clock);
      if (isNaN(seconds)) {
        return;
      }

      if (this.#clockTime == undefined) {
        this.#start = time;
      }

      this.#clockTime = time;
      this.#clockReceived = msg.receiveTime;
    }
  }

  private _getCurrentTime(): Time {
    const now = fromMillis(Date.now());
    if (this.#clockTime == undefined) {
      return now;
    }

    const delta = subtractTimes(now, this.#clockReceived);
    return addTimes(this.#clockTime, delta);
  }

  private async _getSystemState(): Promise<RosGraph> {
    const output: RosGraph = {
      publishers: new Map<string, Set<string>>(),
      subscribers: new Map<string, Set<string>>(),
      services: new Map<string, Set<string>>(),
    };

    const addEntry = (map: Map<string, Set<string>>, key: string, value: string) => {
      let entries = map.get(key);
      if (entries == undefined) {
        entries = new Set<string>();
        map.set(key, entries);
      }
      entries.add(value);
    };

    return await new Promise((resolve, reject) => {
      this.#rosClient?.getNodes(async (nodes) => {
        await Promise.all(
          nodes.map((node) => {
            this.#rosClient?.getNodeDetails(
              node,
              (subscriptions, publications, services) => {
                publications.forEach((pub) => addEntry(output.publishers, pub, node));
                subscriptions.forEach((sub) => addEntry(output.subscribers, sub, node));
                services.forEach((srv) => addEntry(output.services, srv, node));
              },
              reject,
            );
          }),
        );

        resolve(output);
      }, reject);
    });
  }
}
