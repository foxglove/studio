// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { isEqual, sortBy } from "lodash";
import { v4 as uuidv4 } from "uuid";

import { Sockets } from "@foxglove/electron-socket/renderer";
import Logger from "@foxglove/log";
import { RosNode, TcpSocket } from "@foxglove/ros1";
import { RosMsgDefinition } from "@foxglove/rosmsg";
import {
  Time,
  add as addTimes,
  fromMillis,
  subtract as subtractTimes,
  toSec,
} from "@foxglove/rostime";
import OsContextSingleton from "@foxglove/studio-base/OsContextSingleton";
import PlayerProblemManager from "@foxglove/studio-base/players/PlayerProblemManager";
import {
  AdvertiseOptions,
  MessageEvent,
  ParameterValue,
  Player,
  PlayerCapabilities,
  PlayerMetricsCollectorInterface,
  PlayerPresence,
  PlayerState,
  PlayerProblem,
  PublishPayload,
  SubscribePayload,
  Topic,
} from "@foxglove/studio-base/players/types";
import { RosDatatypes } from "@foxglove/studio-base/types/RosDatatypes";
import debouncePromise from "@foxglove/studio-base/util/debouncePromise";
import rosDatatypesToMessageDefinition from "@foxglove/studio-base/util/rosDatatypesToMessageDefinition";
import { getTopicsByTopicName } from "@foxglove/studio-base/util/selectors";
import { TimestampMethod } from "@foxglove/studio-base/util/time";
import { HttpServer } from "@foxglove/xmlrpc";

const log = Logger.getLogger(__filename);
const rosLog = Logger.getLogger("ROS1");

const CAPABILITIES = [
  PlayerCapabilities.advertise,
  PlayerCapabilities.getParameters,
  PlayerCapabilities.setParameters,
];

enum Problem {
  Connection = "Connection",
  Parameters = "Parameters",
  Graph = "Graph",
  Publish = "Publish",
  Node = "Node",
}

type Ros1PlayerOpts = {
  url: string;
  hostname?: string;
  metricsCollector: PlayerMetricsCollectorInterface;
};

// Connects to `rosmaster` instance using `@foxglove/ros1`. Currently doesn't support seeking or
// showing simulated time, so current time from Date.now() is always used instead.
export default class Ros1Player implements Player {
  #url: string; // rosmaster URL.
  #hostname?: string; // ROS_HOSTNAME
  #rosNode?: RosNode; // Our ROS node when we're connected.
  #id: string = uuidv4(); // Unique ID for this player.
  #listener?: (arg0: PlayerState) => Promise<void>; // Listener for _emitState().
  #closed: boolean = false; // Whether the player has been completely closed using close().
  #providerTopics?: Topic[]; // Topics as advertised by rosmaster.
  #providerDatatypes: RosDatatypes = new Map(); // All ROS message definitions received from subscriptions and set by publishers.
  #publishedTopics = new Map<string, Set<string>>(); // A map of topic names to the set of publisher IDs publishing each topic.
  #subscribedTopics = new Map<string, Set<string>>(); // A map of topic names to the set of subscriber IDs subscribed to each topic.
  #services = new Map<string, Set<string>>(); // A map of service names to service provider IDs that provide each service.
  #parameters = new Map<string, ParameterValue>(); // rosparams
  #start?: Time; // The time at which we started playing.
  #clockTime?: Time; // The most recent published `/clock` time, if available
  #clockReceived: Time = { sec: 0, nsec: 0 }; // The local time when `_clockTime` was last received
  #requestedSubscriptions: SubscribePayload[] = []; // Requested subscriptions by setSubscriptions()
  #parsedMessages: MessageEvent<unknown>[] = []; // Queue of messages that we'll send in next _emitState() call.
  #messageOrder: TimestampMethod = "receiveTime";
  #requestTopicsTimeout?: ReturnType<typeof setTimeout>; // setTimeout() handle for _requestTopics().
  #hasReceivedMessage = false;
  #metricsCollector: PlayerMetricsCollectorInterface;
  #presence: PlayerPresence = PlayerPresence.INITIALIZING;
  #problems = new PlayerProblemManager();
  #emitTimer?: ReturnType<typeof setTimeout>;

  constructor({ url, hostname, metricsCollector }: Ros1PlayerOpts) {
    log.info(`initializing Ros1Player (url=${url})`);
    this.#metricsCollector = metricsCollector;
    this.#url = url;
    this.#hostname = hostname;
    this.#start = fromMillis(Date.now());
    this.#metricsCollector.playerConstructed();
    void this.#open();
  }

  #open = async (): Promise<void> => {
    const os = OsContextSingleton;
    if (this.#closed || os == undefined) {
      return;
    }
    this.#presence = PlayerPresence.INITIALIZING;

    const hostname =
      this.#hostname ??
      RosNode.GetRosHostname(os.getEnvVar, os.getHostname, os.getNetworkInterfaces);

    const net = await Sockets.Create();
    const httpServer = await net.createHttpServer();
    const tcpSocketCreate = async (options: { host: string; port: number }): Promise<TcpSocket> => {
      return await net.createSocket(options.host, options.port);
    };
    const tcpServer = await net.createServer();
    void tcpServer.listen(undefined, hostname, 10);

    if (this.#rosNode == undefined) {
      const rosNode = new RosNode({
        name: "/foxglovestudio",
        hostname,
        pid: os.pid,
        rosMasterUri: this.#url,
        httpServer: httpServer as unknown as HttpServer,
        tcpSocketCreate,
        tcpServer,
        log: rosLog,
      });
      this.#rosNode = rosNode;

      rosNode.on("paramUpdate", ({ key, value, prevValue, callerId }) => {
        log.debug("paramUpdate", key, value, prevValue, callerId);
        this.#parameters = new Map(rosNode.parameters);
      });
      rosNode.on("error", (error) => {
        this._addProblem(Problem.Node, {
          severity: "warn",
          message: "ROS node error",
          tip: `Connectivity will be automatically re-established`,
          error,
        });
      });
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

  private _clearProblem(id: string, { skipEmit = false }: { skipEmit?: boolean } = {}): void {
    if (this.#problems.removeProblem(id)) {
      if (!skipEmit) {
        this.#emitState();
      }
    }
  }

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
      const topicArrays = await rosNode.getPublishedTopics();
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
      try {
        const params = await rosNode.subscribeAllParams();
        if (!isEqual(params, this.#parameters)) {
          this.#parameters = new Map();
          params.forEach((value, key) => this.#parameters.set(key, value));
        }
        this._clearProblem(Problem.Parameters, { skipEmit: true });
      } catch (error) {
        this._addProblem(
          Problem.Parameters,
          {
            severity: "warn",
            message: "ROS parameter fetch failed",
            tip: `Ensure that roscore is running and accessible at: ${this.#url}`,
            error,
          },
          { skipEmit: true },
        );
      }

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
          tip: `Ensure that roscore is running and accessible at: ${this.#url}`,
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
        name: this.#url,
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
      name: this.#url,
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
        services: this.#services,
        parameters: this.#parameters,
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
      this.#rosNode.shutdown();
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

      const { datatype } = availTopic;
      const subscription = this.#rosNode.subscribe({ topic: topicName, dataType: datatype });

      subscription.on("header", (_header, msgdef, _reader) => {
        // We have to create a new object instead of just updating _providerDatatypes to support
        // shallow memo
        const newDatatypes = this.#getRosDatatypes(datatype, msgdef);
        this.#providerDatatypes = new Map([...this.#providerDatatypes, ...newDatatypes]);
      });
      subscription.on("message", (message, _data, _pub) =>
        this.#handleMessage(topicName, message, true),
      );
      subscription.on("error", (error) => {
        this._addProblem(`subscribe:${topicName}`, {
          severity: "warn",
          message: `Topic subscription error for "${topicName}"`,
          tip: `The subscription to "${topicName}" will be automatically re-established`,
          error,
        });
      });
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
    message: unknown,
    // This is a hot path so we avoid extra object allocation from a parameters struct
    // eslint-disable-next-line @foxglove/no-boolean-parameters
    external: boolean,
  ): void => {
    if (this.#providerTopics == undefined) {
      return;
    }

    const receiveTime = fromMillis(Date.now());

    if (external && !this.#hasReceivedMessage) {
      this.#hasReceivedMessage = true;
      this.#metricsCollector.recordTimeToFirstMsgs();
    }

    const msg: MessageEvent<unknown> = { topic, receiveTime, message };
    this.#parsedMessages.push(msg);
    this._handleInternalMessage(msg);

    this.#emitState();
  };

  setPublishers(publishers: AdvertiseOptions[]): void {
    if (!this.#rosNode || this.#closed) {
      return;
    }

    const validPublishers = publishers.filter(({ topic }) => topic.length > 0 && topic !== "/");
    const topics = new Set<string>(validPublishers.map(({ topic }) => topic));

    // Clear all problems related to publishing
    this._clearPublishProblems({ skipEmit: true });

    // Unadvertise any topics that were previously published and no longer appear in the list
    for (const topic of this.#rosNode.publications.keys()) {
      if (!topics.has(topic)) {
        this.#rosNode.unadvertise(topic);
      }
    }

    // Unadvertise any topics where the dataType changed
    for (const { topic, datatype } of validPublishers) {
      const existingPub = this.#rosNode.publications.get(topic);
      if (existingPub != undefined && existingPub.dataType !== datatype) {
        this.#rosNode.unadvertise(topic);
      }
    }

    // Advertise new topics
    for (const advertiseOptions of validPublishers) {
      const { topic, datatype: dataType, options } = advertiseOptions;

      if (this.#rosNode.publications.has(topic)) {
        continue;
      }

      const msgdefProblemId = `msgdef:${topic}`;
      const advertiseProblemId = `advertise:${topic}`;

      // Try to retrieve the ROS message definition for this topic
      let msgdef: RosMsgDefinition[];
      try {
        const datatypes = options?.["datatypes"] as RosDatatypes | undefined;
        if (!datatypes || !(datatypes instanceof Map)) {
          throw new Error("The datatypes option is required for publishing");
        }
        msgdef = rosDatatypesToMessageDefinition(datatypes, dataType);
      } catch (error) {
        this._addProblem(msgdefProblemId, {
          severity: "warn",
          message: `Unknown message definition for "${topic}"`,
          tip: `Try subscribing to the topic "${topic} before publishing to it`,
        });
        continue;
      }

      // Advertise this topic to ROS as being published by us
      this.#rosNode.advertise({ topic, dataType, messageDefinition: msgdef }).catch((error) =>
        this._addProblem(advertiseProblemId, {
          severity: "error",
          message: `Failed to advertise "${topic}"`,
          error,
        }),
      );
    }

    this.#emitState();
  }

  setParameter(key: string, value: ParameterValue): void {
    log.debug(`Ros1Player.setParameter(key=${key}, value=${value})`);
    this.#rosNode?.setParameter(key, value);
  }

  publish({ topic, msg }: PublishPayload): void {
    const problemId = `publish:${topic}`;

    if (this.#rosNode != undefined) {
      if (this.#rosNode.isAdvertising(topic)) {
        this.#rosNode
          .publish(topic, msg)
          .then(() => this._clearProblem(problemId))
          .catch((error) =>
            this._addProblem(problemId, {
              severity: "error",
              message: `Publishing to ${topic} failed`,
              error,
            }),
          );
      } else {
        this._addProblem(problemId, {
          severity: "warn",
          message: `Unable to publish to "${topic}"`,
          tip: `ROS1 may be disconnected. Please try again in a moment`,
        });
      }
    }
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
    const typesByName: RosDatatypes = new Map();
    for (const def of messageDefinition) {
      // The first definition usually doesn't have an explicit name so we use the datatype
      if (def.name == undefined) {
        typesByName.set(datatype, def);
      } else {
        typesByName.set(def.name, def);
      }
    }
    return typesByName;
  };

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

  private async _updateConnectionGraph(rosNode: RosNode): Promise<void> {
    try {
      const graph = await rosNode.getSystemState();
      if (
        !isEqual(this.#publishedTopics, graph.publishers) ||
        !isEqual(this.#subscribedTopics, graph.subscribers) ||
        !isEqual(this.#services, graph.services)
      ) {
        this.#publishedTopics = graph.publishers;
        this.#subscribedTopics = graph.subscribers;
        this.#services = graph.services;
      }
      this._clearProblem(Problem.Graph, { skipEmit: true });
    } catch (error) {
      this._addProblem(
        Problem.Graph,
        {
          severity: "warn",
          message: "Unable to update connection graph",
          tip: `The connection graph contains information about publishers and subscribers. A
stale graph may result in missing topics you expect. Ensure that roscore is reachable at ${
            this.#url
          }.`,
          error,
        },
        { skipEmit: true },
      );
      this.#publishedTopics = new Map();
      this.#subscribedTopics = new Map();
      this.#services = new Map();
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
}
