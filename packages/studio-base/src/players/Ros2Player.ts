// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { isEqual, sortBy } from "lodash";
import { v4 as uuidv4 } from "uuid";

import { Sockets } from "@foxglove/electron-socket/renderer";
import Logger from "@foxglove/log";
import { RosNode } from "@foxglove/ros2";
import { RosMsgDefinition } from "@foxglove/rosmsg";
import { definitions as commonDefs } from "@foxglove/rosmsg-msgs-common";
import { definitions as foxgloveDefs } from "@foxglove/rosmsg-msgs-foxglove";
import { Time, fromMillis } from "@foxglove/rostime";
import OsContextSingleton from "@foxglove/studio-base/OsContextSingleton";
import PlayerProblemManager from "@foxglove/studio-base/players/PlayerProblemManager";
import {
  AdvertiseOptions,
  MessageEvent,
  ParameterValue,
  Player,
  PlayerMetricsCollectorInterface,
  PlayerPresence,
  PlayerState,
  PlayerProblem,
  PublishPayload,
  SubscribePayload,
  Topic,
} from "@foxglove/studio-base/players/types";
import debouncePromise from "@foxglove/studio-base/util/debouncePromise";
import rosDatatypesToMessageDefinition from "@foxglove/studio-base/util/rosDatatypesToMessageDefinition";
import { getTopicsByTopicName } from "@foxglove/studio-base/util/selectors";
import { TimestampMethod } from "@foxglove/studio-base/util/time";

const log = Logger.getLogger(__filename);
const rosLog = Logger.getLogger("ROS2");

const CAPABILITIES: string[] = [];

enum Problem {
  Connection = "Connection",
  Parameters = "Parameters",
  Graph = "Graph",
  Publish = "Publish",
}

type Ros2PlayerOpts = {
  domainId: number;
  metricsCollector: PlayerMetricsCollectorInterface;
};

// Connects to a ROS 2 network using RTPS over UDP, discovering peers via UDP multicast.
export default class Ros2Player implements Player {
  #domainId: number; // ROS 2 DDS (RTPS) domain
  #rosNode?: RosNode; // Our ROS node when we're connected.
  #id: string = uuidv4(); // Unique ID for this player.
  #listener?: (arg0: PlayerState) => Promise<void>; // Listener for _emitState().
  #closed = false; // Whether the player has been completely closed using close().
  #providerTopics?: Topic[]; // Topics as advertised by peers
  #providerDatatypes = new Map<string, RosMsgDefinition>(); // All known ROS 2 message definitions.
  #publishedTopics = new Map<string, Set<string>>(); // A map of topic names to the set of publisher IDs publishing each topic.
  #subscribedTopics = new Map<string, Set<string>>(); // A map of topic names to the set of subscriber IDs subscribed to each topic.
  // private _services = new Map<string, Set<string>>(); // A map of service names to service provider IDs that provide each service.
  // private _parameters = new Map<string, ParameterValue>(); // rosparams
  #start?: Time; // The time at which we started playing.
  // private _clockTime?: Time; // The most recent published `/clock` time, if available
  // private _clockReceived: Time = { sec: 0, nsec: 0 }; // The local time when `_clockTime` was last received
  #requestedSubscriptions: SubscribePayload[] = []; // Requested subscriptions by setSubscriptions()
  #parsedMessages: MessageEvent<unknown>[] = []; // Queue of messages that we'll send in next _emitState() call.
  #messageOrder: TimestampMethod = "receiveTime";
  #requestTopicsTimeout?: ReturnType<typeof setTimeout>; // setTimeout() handle for _requestTopics().
  #hasReceivedMessage = false;
  #metricsCollector: PlayerMetricsCollectorInterface;
  #presence: PlayerPresence = PlayerPresence.INITIALIZING;
  #problems = new PlayerProblemManager();
  #emitTimer?: ReturnType<typeof setTimeout>;

  constructor({ domainId, metricsCollector }: Ros2PlayerOpts) {
    log.info(`initializing Ros2Player (domainId=${domainId})`);
    this.#domainId = domainId;
    this.#metricsCollector = metricsCollector;
    this.#start = fromMillis(Date.now());
    this.#metricsCollector.playerConstructed();

    // The ros1ToRos2Type() hack can be removed when @foxglove/rosmsg-msgs-* packages are updated to
    // natively support ROS 2
    for (const dataType in commonDefs) {
      const msgDef = (commonDefs as Record<string, RosMsgDefinition>)[dataType]!;
      this.#providerDatatypes.set(dataType, msgDef);
      this.#providerDatatypes.set(ros1ToRos2Type(dataType), msgDef);
    }
    for (const dataType in foxgloveDefs) {
      const msgDef = (foxgloveDefs as Record<string, RosMsgDefinition>)[dataType]!;
      this.#providerDatatypes.set(dataType, msgDef);
      this.#providerDatatypes.set(ros1ToRos2Type(dataType), msgDef);
    }

    void this.#open();
  }

  #open = async (): Promise<void> => {
    const os = OsContextSingleton;
    if (this.#closed || os == undefined) {
      return;
    }
    this.#presence = PlayerPresence.INITIALIZING;

    const net = await Sockets.Create();
    // eslint-disable-next-line @typescript-eslint/promise-function-async
    const udpSocketCreate = () => net.createUdpSocket();

    if (this.#rosNode == undefined) {
      const rosNode = new RosNode({
        name: "/foxglovestudio",
        domainId: this.#domainId,
        udpSocketCreate,
        getNetworkInterfaces: os.getNetworkInterfaces,
        log: rosLog,
      });
      this.#rosNode = rosNode;

      // rosNode.on("paramUpdate", ({ key, value, prevValue, callerId }) => {
      //   log.debug("paramUpdate", key, value, prevValue, callerId);
      //   this._parameters = new Map(rosNode.parameters);
      // });
    }

    await this.#rosNode.start();
    await this.#requestTopics();
    this.#presence = PlayerPresence.PRESENT;
  };

  private _addProblem(
    id: string,
    problem: PlayerProblem,
    { skipEmit = false }: { skipEmit?: boolean } = {},
  ): void {
    this.#problems.addProblem(id, problem);
    if (!skipEmit) {
      this.#emitState();
    }
  }

  // private _clearProblem(id: string, skipEmit = false): void {
  //   if (this._problems.removeProblem(id)) {
  //     if (!skipEmit) {
  //       this._emitState();
  //     }
  //   }
  // }

  private _clearPublishProblems({ skipEmit = false }: { skipEmit?: boolean } = {}) {
    if (
      this.#problems.removeProblems(
        (id) =>
          id.startsWith("msgdef:") || id.startsWith("advertise:") || id.startsWith("publish:"),
      )
    ) {
      if (!skipEmit) {
        this.#emitState();
      }
    }
  }

  #requestTopics = async (): Promise<void> => {
    if (this.#requestTopicsTimeout) {
      clearTimeout(this.#requestTopicsTimeout);
    }
    const rosNode = this.#rosNode;
    if (!rosNode || this.#closed) {
      return;
    }

    try {
      const topicArrays = rosNode.getPublishedTopics();
      const topics = topicArrays.map(([name, datatype]) => ({ name, datatype }));
      // Sort them for easy comparison
      const sortedTopics: Topic[] = sortBy(topics, "name");

      if (this.#providerTopics == undefined) {
        this.#metricsCollector.initialized();
      }

      if (!isEqual(sortedTopics, this.#providerTopics)) {
        this.#providerTopics = sortedTopics;
      }

      // Try subscribing again, since we might now be able to subscribe to some new topics.
      this.setSubscriptions(this.#requestedSubscriptions);

      // Subscribe to all parameters
      // try {
      //   const params = await rosNode.subscribeAllParams();
      //   if (!isEqual(params, this._parameters)) {
      //     this._parameters = new Map();
      //     params.forEach((value, key) => this._parameters.set(key, value));
      //   }
      //   this._clearProblem(Problem.Parameters, true);
      // } catch (error) {
      //   this._addProblem(
      //     Problem.Parameters,
      //     {
      //       severity: "warn",
      //       message: "ROS parameter fetch failed",
      //       tip: `Ensure that roscore is running and accessible at: ${this._url}`,
      //       error,
      //     },
      //     true,
      //   );
      // }

      // Fetch the full graph topology
      await this._updateConnectionGraph(rosNode);

      this.#presence = PlayerPresence.PRESENT;
      this.#emitState();
    } catch (error) {
      this.#presence = PlayerPresence.INITIALIZING;
      this._addProblem(
        Problem.Connection,
        {
          severity: "error",
          message: "ROS connection failed",
          tip: `Ensure a ROS 2 DDS system is running on the local network and UDP multicast is supported`,
          error,
        },
        { skipEmit: false },
      );
    } finally {
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

    const providerTopics = this.#providerTopics;
    const start = this.#start;
    if (!providerTopics || !start) {
      return this.#listener({
        presence: this.#presence,
        progress: {},
        capabilities: CAPABILITIES,
        playerId: this.#id,
        problems: this.#problems.problems(),
        activeData: undefined,
      });
    }

    // Time is always moving forward even if we don't get messages from the server.
    // If we are not connected, don't emit updates since we are not longer getting new data
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
      presence: this.#presence,
      progress: {},
      capabilities: CAPABILITIES,
      playerId: this.#id,
      problems: this.#problems.problems(),

      activeData: {
        messages,
        totalBytesReceived: this.#rosNode?.receivedBytes() ?? 0,
        messageOrder: this.#messageOrder,
        startTime: start,
        endTime: currentTime,
        currentTime,
        isPlaying: true,
        speed: 1,
        // We don't support seeking, so we need to set this to any fixed value. Just avoid 0 so
        // that we don't accidentally hit falsy checks.
        lastSeekTime: 1,
        topics: providerTopics,
        datatypes: this.#providerDatatypes,
        publishedTopics: this.#publishedTopics,
        subscribedTopics: this.#subscribedTopics,
        // services: this._services,
        // parameters: this._parameters,
        parsedMessageDefinitionsByTopic: {},
      },
    });
  });

  setListener(listener: (arg0: PlayerState) => Promise<void>): void {
    this.#listener = listener;
    this.#emitState();
  }

  close(): void {
    this.#closed = true;
    if (this.#rosNode) {
      void this.#rosNode.shutdown();
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

    if (!this.#rosNode || this.#closed) {
      return;
    }

    // Subscribe to additional topics used by Ros1Player itself
    this._addInternalSubscriptions(subscriptions);

    // See what topics we actually can subscribe to.
    const availableTopicsByTopicName = getTopicsByTopicName(this.#providerTopics ?? []);
    const topicNames = subscriptions
      .map(({ topic }) => topic)
      .filter((topicName) => availableTopicsByTopicName[topicName]);

    // Subscribe to all topics that we aren't subscribed to yet.
    for (const topicName of topicNames) {
      const availTopic = availableTopicsByTopicName[topicName];
      if (!availTopic || this.#rosNode.subscriptions.has(topicName)) {
        continue;
      }

      const { datatype: dataType } = availTopic;

      // Try to retrieve the ROS message definition for this topic
      let msgDefinition: RosMsgDefinition[] | undefined;
      try {
        msgDefinition = rosDatatypesToMessageDefinition(this.#providerDatatypes, dataType);
      } catch (error) {
        this._addProblem(`msgdef:${topicName}`, {
          severity: "warn",
          message: `Unknown message definition for "${topicName}"`,
          tip: `Only core ROS 2 data types are currently supported`,
        });
      }

      const subscription = this.#rosNode.subscribe({ topic: topicName, dataType, msgDefinition });

      subscription.on("message", (timestamp, message, _data, _pub) =>
        this.#handleMessage(topicName, timestamp, message, true),
      );
    }

    // Unsubscribe from topics that we are subscribed to but shouldn't be.
    for (const topicName of this.#rosNode.subscriptions.keys()) {
      if (!topicNames.includes(topicName)) {
        {
          this.#rosNode.unsubscribe(topicName);
        }
      }
    }
  }

  #handleMessage = (
    topic: string,
    timestamp: Time,
    message: unknown,
    // This is a hot path so we avoid extra object allocation from a parameters struct
    // eslint-disable-next-line @foxglove/no-boolean-parameters
    external: boolean,
  ): void => {
    if (this.#providerTopics == undefined) {
      return;
    }

    // const receiveTime = fromMillis(Date.now());
    const receiveTime = timestamp;

    if (external && !this.#hasReceivedMessage) {
      this.#hasReceivedMessage = true;
      this.#metricsCollector.recordTimeToFirstMsgs();
    }

    const msg: MessageEvent<unknown> = { topic, receiveTime, message };
    this.#parsedMessages.push(msg);
    this._handleInternalMessage(msg);

    this.#emitState();
  };

  setPublishers(_publishers: AdvertiseOptions[]): void {
    if (!this.#rosNode || this.#closed) {
      return;
    }

    // const validPublishers = publishers.filter(({ topic }) => topic.length > 0 && topic !== "/");
    // const topics = new Set<string>(validPublishers.map(({ topic }) => topic));

    // Clear all problems related to publishing
    this._clearPublishProblems({ skipEmit: false });

    // Unadvertise any topics that were previously published and no longer appear in the list
    // for (const topic of this._rosNode.publications.keys()) {
    //   if (!topics.has(topic)) {
    //     this._rosNode.unadvertise(topic);
    //   }
    // }

    // // Unadvertise any topics where the dataType changed
    // for (const { topic, datatype } of validPublishers) {
    //   const existingPub = this._rosNode.publications.get(topic);
    //   if (existingPub != undefined && existingPub.dataType !== datatype) {
    //     this._rosNode.unadvertise(topic);
    //   }
    // }

    // // Advertise new topics
    // for (const { topic, datatype: dataType, datatypes } of validPublishers) {
    //   if (this._rosNode.publications.has(topic)) {
    //     continue;
    //   }

    //   const msgdefProblemId = `msgdef:${topic}`;
    //   const advertiseProblemId = `advertise:${topic}`;

    //   // Try to retrieve the ROS message definition for this topic
    //   let msgdef: RosMsgDefinition[];
    //   try {
    //     msgdef = rosDatatypesToMessageDefinition(datatypes, dataType);
    //   } catch (error) {
    //     this._addProblem(msgdefProblemId, {
    //       severity: "warn",
    //       message: `Unknown message definition for "${topic}"`,
    //       tip: `Try subscribing to the topic "${topic} before publishing to it`,
    //     });
    //     continue;
    //   }

    //   // Advertise this topic to ROS as being published by us
    //   this._rosNode.advertise({ topic, dataType, messageDefinition: msgdef }).catch((error) =>
    //     this._addProblem(advertiseProblemId, {
    //       severity: "error",
    //       message: `Failed to advertise "${topic}"`,
    //       error,
    //     }),
    //   );
    // }

    this.#emitState();
  }

  setParameter(_key: string, _value: ParameterValue): void {
    // log.debug(`Ros1Player.setParameter(key=${key}, value=${value})`);
    // this._rosNode?.setParameter(key, value);
  }

  publish(_payload: PublishPayload): void {
    // const problemId = `publish:${topic}`;
    // if (this._rosNode != undefined) {
    //   if (this._rosNode.isAdvertising(topic)) {
    //     this._rosNode
    //       .publish(topic, msg)
    //       .then(() => this._clearProblem(problemId))
    //       .catch((error) =>
    //         this._addProblem(problemId, {
    //           severity: "error",
    //           message: `Publishing to ${topic} failed`,
    //           error,
    //         }),
    //       );
    //   } else {
    //     this._addProblem(problemId, {
    //       severity: "warn",
    //       message: `Unable to publish to "${topic}"`,
    //       tip: `ROS1 may be disconnected. Please try again in a moment`,
    //     });
    //   }
    // }
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

  private _addInternalSubscriptions(subscriptions: SubscribePayload[]): void {
    // Always subscribe to /clock if available
    if (subscriptions.find((sub) => sub.topic === "/clock") == undefined) {
      subscriptions.unshift({
        topic: "/clock",
        requester: { type: "other", name: "Ros1Player" },
      });
    }
  }

  private _handleInternalMessage(_msg: MessageEvent<unknown>): void {
    // const maybeClockMsg = msg.message as { clock?: Time };
    // if (msg.topic === "/clock" && maybeClockMsg.clock && !isNaN(maybeClockMsg.clock?.sec)) {
    //   const time = maybeClockMsg.clock;
    //   const seconds = toSec(maybeClockMsg.clock);
    //   if (isNaN(seconds)) {
    //     return;
    //   }
    //   if (this._clockTime == undefined) {
    //     this._start = time;
    //   }
    //   this._clockTime = time;
    //   this._clockReceived = msg.receiveTime;
    // }
  }

  private async _updateConnectionGraph(_rosNode: RosNode): Promise<void> {
    //     try {
    //       const graph = await rosNode.getSystemState();
    //       if (
    //         !isEqual(this._publishedTopics, graph.publishers) ||
    //         !isEqual(this._subscribedTopics, graph.subscribers) ||
    //         !isEqual(this._services, graph.services)
    //       ) {
    //         this._publishedTopics = graph.publishers;
    //         this._subscribedTopics = graph.subscribers;
    //         this._services = graph.services;
    //       }
    //       this._clearProblem(Problem.Graph, true);
    //     } catch (error) {
    //       this._addProblem(
    //         Problem.Graph,
    //         {
    //           severity: "warn",
    //           message: "Unable to update connection graph",
    //           tip: `The connection graph contains information about publishers and subscribers. A
    // stale graph may result in missing topics you expect. Ensure that roscore is reachable at ${this._url}.`,
    //           error,
    //         },
    //         true,
    //       );
    //       this._publishedTopics = new Map();
    //       this._subscribedTopics = new Map();
    //       this._services = new Map();
    //     }
  }

  private _getCurrentTime(): Time {
    const now = fromMillis(Date.now());
    return now;
    // if (this._clockTime == undefined) {
    //   return now;
    // }

    // const delta = subtractTimes(now, this._clockReceived);
    // return addTimes(this._clockTime, delta);
  }
}

function ros1ToRos2Type(dataType: string): string {
  const parts = dataType.split("/");
  if (parts.length === 2) {
    return `${parts[0]}/msg/${parts[1]}`;
  }
  return dataType;
}
