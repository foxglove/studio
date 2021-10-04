// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { v4 as uuidv4 } from "uuid";

import Logger from "@foxglove/log";
import { parse as parseMessageDefinition } from "@foxglove/rosmsg";
import {
  add,
  clampTime,
  fromMillis,
  fromRFC3339String,
  fromSec,
  subtract,
  Time,
  toDate,
  toSec,
} from "@foxglove/rostime";
import { GlobalVariables } from "@foxglove/studio-base/hooks/useGlobalVariables";
import {
  AdvertiseOptions,
  MessageEvent,
  ParameterValue,
  Player,
  PlayerMetricsCollectorInterface,
  PlayerPresence,
  PlayerProblem,
  PlayerState,
  Progress,
  PublishPayload,
  SubscribePayload,
  Topic,
} from "@foxglove/studio-base/players/types";
import ConsoleApi from "@foxglove/studio-base/services/ConsoleApi";
import { RosDatatypes } from "@foxglove/studio-base/types/RosDatatypes";
import debouncePromise from "@foxglove/studio-base/util/debouncePromise";
import signal, { Signal } from "@foxglove/studio-base/util/signal";
import { formatTimeRaw } from "@foxglove/studio-base/util/time";

import MessageMemoryCache from "./MessageMemoryCache";
import collateMessageStream from "./collateMessageStream";
import streamMessages from "./streamMessages";

const log = Logger.getLogger(__filename);

const CAPABILITIES: string[] = ["playbackControl"];

type FoxgloveDataPlatformPlayerOpts = {
  consoleApi: ConsoleApi;
  params: {
    start: string;
    end: string;
    seek?: string;
    deviceId: string;
  };
  metricsCollector: PlayerMetricsCollectorInterface;
};

const ZERO_TIME = Object.freeze({ sec: 0, nsec: 0 });

export default class FoxgloveDataPlatformPlayer implements Player {
  readonly #preloadThresholdSecs = 5;
  readonly #preloadDurationSecs = 15;

  #id: string = uuidv4(); // Unique ID for this player
  #name: string;
  #listener?: (arg0: PlayerState) => Promise<void>; // Listener for _emitState()
  #totalBytesReceived = 0;
  #initialized = false;
  #closed = false; // Whether the player has been completely closed using close()
  #isPlaying = false;
  #speed = 1;
  #start: Time;
  #end: Time;
  #consoleApi: ConsoleApi;
  #deviceId: string;
  #currentTime: Time;
  #lastSeekTime?: number;
  #topics: Topic[] = [];
  #datatypes: RosDatatypes = new Map();
  #metricsCollector: PlayerMetricsCollectorInterface;
  #presence: PlayerPresence = PlayerPresence.INITIALIZING;
  #preloadedMessages: MessageMemoryCache;
  #currentPreloadTask?: AbortController;
  #requestedTopics: string[] = [];
  #progress: Progress = {};
  #loadedMoreMessages?: Signal<void>;
  #nextFrame: MessageEvent<unknown>[] = [];

  // track issues within the player
  #problems: PlayerProblem[] = [];
  #problemsById = new Map<string, PlayerProblem>();

  constructor({ params, metricsCollector, consoleApi }: FoxgloveDataPlatformPlayerOpts) {
    log.info(`initializing FoxgloveDataPlatformPlayer ${JSON.stringify(params)}`);
    this.#metricsCollector = metricsCollector;
    this.#metricsCollector.playerConstructed();
    const start = fromRFC3339String(params.start);
    const end = fromRFC3339String(params.end);
    if (!start || !end) {
      throw new Error(`Invalid start/end time: ${start}, ${end}`);
    }
    this.#start = start;
    this.#end = end;
    this.#currentTime = this.#start;
    this.#deviceId = params.deviceId;
    this.#name = `${this.#deviceId}, ${formatTimeRaw(this.#start)} to ${formatTimeRaw(this.#end)}`;
    this.#consoleApi = consoleApi;
    this.#preloadedMessages = new MessageMemoryCache({ start: this.#start, end: this.#end });
    this.#open().catch((error) => {
      this.#presence = PlayerPresence.ERROR;
      this._addProblem("open-failed", { message: error.message, error, severity: "error" });
    });
  }

  #open = async (): Promise<void> => {
    if (this.#closed) {
      return;
    }
    this.#presence = PlayerPresence.INITIALIZING;
    this.#emitState();

    const rawTopics = await this.#consoleApi.topics({
      deviceId: this.#deviceId,
      start: toDate(this.#start).toISOString(),
      end: toDate(this.#end).toISOString(),
      includeSchemas: true,
    });
    if (rawTopics.length === 0) {
      this.#presence = PlayerPresence.ERROR;
      this._addProblem("no-data", {
        message: `No data available for ${this.#deviceId} between ${formatTimeRaw(
          this.#start,
        )} and ${formatTimeRaw(this.#end)}.`,
        severity: "error",
      });
      return;
    }

    const topics: Topic[] = [];
    const datatypes: RosDatatypes = new Map();
    for (const { topic, encoding, schema, schemaName } of rawTopics) {
      if (encoding !== "ros1" && encoding !== "ros2") {
        this._addProblem("bad-encoding", {
          message: `Unsupported encoding for ${topic}: ${encoding}`,
          severity: "error",
        });
        return;
      }
      if (schema == undefined) {
        throw new Error(`missing requested schema for ${topic}`);
      }
      topics.push({ name: topic, datatype: schemaName });
      const parsedDefinitions = parseMessageDefinition(schema, { ros2: encoding === "ros2" });
      parsedDefinitions.forEach(({ name, definitions }, index) => {
        // The first definition usually doesn't have an explicit name,
        // so we get the name from the datatype.
        if (index === 0) {
          datatypes.set(schemaName, { name: schemaName, definitions });
        } else if (name != undefined) {
          datatypes.set(name, { name, definitions });
        }
      });
    }
    this.#topics = topics;
    this.#datatypes = datatypes;

    this.#presence = PlayerPresence.PRESENT;
    this.#initialized = true;
    this.#emitState();
    this._startPreloadTaskIfNeeded();
  };

  private _addProblem(
    id: string,
    problem: PlayerProblem,
    { skipEmit = false }: { skipEmit?: boolean } = {},
  ): void {
    this.#problemsById.set(id, problem);
    this.#problems = Array.from(this.#problemsById.values());
    if (!skipEmit) {
      this.#emitState();
    }
  }

  // Potentially performance-sensitive; await can be expensive
  // eslint-disable-next-line @typescript-eslint/promise-function-async
  #emitState = debouncePromise(() => {
    if (!this.#listener || this.#closed) {
      return Promise.resolve();
    }

    const messages = this.#nextFrame;
    if (messages.length > 0) {
      this.#nextFrame = [];
    }

    return this.#listener({
      name: this.#name,
      presence: this.#presence,
      progress: this.#progress,
      capabilities: CAPABILITIES,
      playerId: this.#id,
      problems: this.#problems,

      activeData: {
        messages,
        totalBytesReceived: this.#totalBytesReceived,
        messageOrder: "receiveTime",
        startTime: this.#start ?? ZERO_TIME,
        endTime: this.#end ?? ZERO_TIME,
        currentTime: this.#currentTime,
        isPlaying: this.#isPlaying,
        speed: this.#speed,
        lastSeekTime: this.#lastSeekTime ?? 0,
        topics: this.#topics,
        datatypes: this.#datatypes,
        publishedTopics: undefined,
        subscribedTopics: undefined,
        services: undefined,
        parameters: undefined,
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
    this.#metricsCollector.close();
    this.#currentPreloadTask?.abort();
    this.#currentPreloadTask = undefined;
    this.#totalBytesReceived = 0;
  }

  setSubscriptions(subscriptions: SubscribePayload[]): void {
    log.debug("setSubscriptions", subscriptions);
    this.#requestedTopics = Array.from(new Set(subscriptions.map(({ topic }) => topic)));
    this._clearPreloadedData();
    this._startPreloadTaskIfNeeded();
    this.#emitState();
  }

  #runPlaybackLoop = debouncePromise(async () => {
    let lastTickEndTime: number | undefined;
    let lastReadMs: number | undefined;
    mainLoop: while (this.#isPlaying) {
      await this.#emitState.currentPromise;

      // compute how long of a time range we want to read by taking into account
      // the time since our last read and how fast we're currently playing back
      const msSinceLastTick =
        lastTickEndTime != undefined ? performance.now() - lastTickEndTime : 20;

      // Read at most 300ms worth of messages, otherwise things can get out of control if rendering
      // is very slow. Also, smooth over the range that we request, so that a single slow frame won't
      // cause the next frame to also be unnecessarily slow by increasing the frame size.
      let readMs = Math.min(msSinceLastTick * this.#speed, 300);
      if (lastReadMs != undefined) {
        readMs = lastReadMs * 0.9 + readMs * 0.1;
      }
      lastReadMs = readMs;

      const lastSeekTime = this.#lastSeekTime;
      const startTime = this.#currentTime;
      const endTime = clampTime(add(startTime, fromMillis(readMs)), this.#start, this.#end);
      this._startPreloadTaskIfNeeded();
      let messages;
      while (
        !(messages = this.#preloadedMessages.getMessages({ start: startTime, end: endTime }))
      ) {
        log.debug("Waiting for more messages");
        // Wait for new messages to be loaded
        await (this.#loadedMoreMessages = signal());
        if (this.#lastSeekTime !== lastSeekTime) {
          lastTickEndTime = undefined;
          continue mainLoop;
        }
      }
      lastTickEndTime = performance.now();
      this.#nextFrame = messages;
      this.#currentTime = endTime;
      this.#emitState();
    }
  });

  private _clearPreloadedData() {
    this.#preloadedMessages.clear();
    this.#progress = {
      fullyLoadedFractionRanges: this.#preloadedMessages.fullyLoadedFractionRanges(),
    };
    this.#currentPreloadTask?.abort();
    this.#currentPreloadTask = undefined;
  }

  private _startPreloadTaskIfNeeded() {
    if (!this.#initialized || this.#closed) {
      return;
    }
    if (this.#currentPreloadTask) {
      return;
    }
    const preloadedExtent = this.#preloadedMessages.fullyLoadedExtent(this.#currentTime);
    const shouldPreload =
      this.#requestedTopics.length > 0 &&
      (!preloadedExtent ||
        toSec(subtract(preloadedExtent.end, this.#currentTime)) < this.#preloadThresholdSecs);
    if (!shouldPreload) {
      return;
    }

    const startTime = clampTime(preloadedExtent?.end ?? this.#currentTime, this.#start, this.#end);
    const proposedEndTime = clampTime(
      add(startTime, fromSec(this.#preloadDurationSecs)),
      this.#start,
      this.#end,
    );
    const endTime =
      this.#preloadedMessages.fullyLoadedExtent(proposedEndTime)?.start ?? proposedEndTime;

    const thisTask = new AbortController();
    thisTask.signal.addEventListener("abort", () => {
      log.debug("Aborting preload task", startTime, endTime);
    });
    this.#currentPreloadTask = thisTask;
    log.debug("Starting preload task", startTime, endTime);
    (async () => {
      const stream = streamMessages(this.#consoleApi, thisTask.signal, {
        deviceId: this.#deviceId,
        start: startTime,
        end: endTime,
        topics: this.#requestedTopics,
      });

      for await (const { messages, range } of collateMessageStream(stream, {
        start: startTime,
        end: endTime,
      })) {
        if (thisTask.signal.aborted) {
          break;
        }
        log.debug("Adding preloaded chunk in", range, "with", messages.length, "messages");
        this.#preloadedMessages.insert(range, messages);
        this.#progress = {
          fullyLoadedFractionRanges: this.#preloadedMessages.fullyLoadedFractionRanges(),
        };
        this.#loadedMoreMessages?.resolve();
        this.#loadedMoreMessages = undefined;
        this.#emitState();
      }
    })()
      .catch((error) => {
        if (error.name === "AbortError") {
          return;
        }
        log.error(error);
        this._addProblem("stream-error", { message: error.message, error, severity: "error" });
      })
      .finally(() => {
        if (this.#currentPreloadTask === thisTask) {
          this.#currentPreloadTask = undefined;
        }
      });

    this.#emitState();
  }

  setPublishers(publishers: AdvertiseOptions[]): void {
    log.warn(`Publishing is not supported in ${this.constructor.name}`, publishers);
  }

  // Modify a remote parameter such as a rosparam.
  setParameter(_key: string, _value: ParameterValue): void {
    throw new Error(`Parameter modification is not supported in ${this.constructor.name}`);
  }

  publish(_request: PublishPayload): void {
    throw new Error(`Publishing is not supported in ${this.constructor.name}`);
  }

  startPlayback(): void {
    if (this.#isPlaying) {
      return;
    }
    this.#metricsCollector.play(this.#speed);
    this.#isPlaying = true;
    this.#runPlaybackLoop();
    this.#emitState();
  }

  pausePlayback(): void {
    if (!this.#isPlaying) {
      return;
    }
    this.#metricsCollector.pause();
    this.#isPlaying = false;
    this.#emitState();
  }

  seekPlayback(time: Time, _backfillDuration?: Time): void {
    log.debug("Seek", time);
    this.#currentTime = time;
    this.#lastSeekTime = Date.now();
    this.#nextFrame = [];
    this.#currentPreloadTask?.abort();
    this.#currentPreloadTask = undefined;
    this._startPreloadTaskIfNeeded();
    this.#emitState();
  }

  setPlaybackSpeed(speed: number): void {
    this.#speed = speed;
    this.#metricsCollector.setSpeed(speed);
    this.#emitState();
  }

  requestBackfill(): void {
    // no-op
  }

  setGlobalVariables(_globalVariables: GlobalVariables): void {
    // no-op
  }
}
