// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { v4 as uuidv4 } from "uuid";

import Logger from "@foxglove/log";
import { parse as parseMessageDefinition } from "@foxglove/rosmsg";
import {
  add,
  clampTime,
  fromDate,
  fromMillis,
  fromSec,
  subtract,
  Time,
  toDate,
  toSec,
} from "@foxglove/rostime";
import { GlobalVariables } from "@foxglove/studio-base/hooks/useGlobalVariables";
import {
  AdvertiseOptions,
  ParameterValue,
  Player,
  PlayerMetricsCollectorInterface,
  PlayerPresence,
  PlayerState,
  PlayerProblem,
  PublishPayload,
  SubscribePayload,
  Topic,
  Progress,
} from "@foxglove/studio-base/players/types";
import { MessageEvent } from "@foxglove/studio-base/players/types";
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

const PRELOAD_THRESHOLD_SECS = 5;
const PRELOAD_DURATION_SECS = 15;

export default class FoxgloveDataPlatformPlayer implements Player {
  private _id: string = uuidv4(); // Unique ID for this player
  private _name: string;
  private _listener?: (arg0: PlayerState) => Promise<void>; // Listener for _emitState()
  private _totalBytesReceived = 0;
  private _closed = false; // Whether the player has been completely closed using close()
  private _isPlaying = false;
  private _speed = 1;
  private _start: Time;
  private _end: Time;
  private _consoleApi: ConsoleApi;
  private _deviceId: string;
  private _currentTime: Time;
  private _lastSeekTime?: number;
  private _topics: Topic[] = [];
  private _datatypes: RosDatatypes = new Map();
  private _metricsCollector: PlayerMetricsCollectorInterface;
  private _presence: PlayerPresence = PlayerPresence.INITIALIZING;
  private _preloadedMessages: MessageMemoryCache;
  private _currentPreloadTask?: AbortController;
  private _requestedTopics: string[] = [];
  private _progress: Progress = {};
  private _loadedMoreMessages?: Signal<void>;
  private _nextFrame: MessageEvent<unknown>[] = [];

  // track issues within the player
  private _problems: PlayerProblem[] = [];
  private _problemsById = new Map<string, PlayerProblem>();

  constructor({ params, metricsCollector, consoleApi }: FoxgloveDataPlatformPlayerOpts) {
    log.info(`initializing FoxgloveDataPlatformPlayer ${JSON.stringify(params)}`);
    this._metricsCollector = metricsCollector;
    this._metricsCollector.playerConstructed();
    this._start = fromDate(new Date(params.start)); // FIXME: https://github.com/foxglove/data-platform/issues/150
    this._end = fromDate(new Date(params.end));
    this._currentTime = this._start;
    this._deviceId = params.deviceId;
    this._name = `${this._deviceId}, ${formatTimeRaw(this._start)} to ${formatTimeRaw(this._end)}`;
    this._consoleApi = consoleApi;
    this._preloadedMessages = new MessageMemoryCache({ start: this._start, end: this._end });
    this._open().catch((error) => {
      this._presence = PlayerPresence.ERROR;
      this._addProblem("open-failed", { message: error.message, error, severity: "error" });
    });
  }

  private _open = async (): Promise<void> => {
    if (this._closed) {
      return;
    }
    this._presence = PlayerPresence.INITIALIZING;
    this._emitState();

    const rawTopics = await this._consoleApi.topics({
      deviceId: this._deviceId,
      start: toDate(this._start).toISOString(),
      end: toDate(this._end).toISOString(),
      includeSchemas: true,
    });
    if (rawTopics.length === 0) {
      this._presence = PlayerPresence.ERROR;
      this._addProblem("no-data", {
        message: `No data available for ${this._deviceId} between ${formatTimeRaw(
          this._start,
        )} and ${formatTimeRaw(this._end)}.`,
        severity: "error",
      });
      return;
    }

    const topics: Topic[] = [];
    const datatypes: RosDatatypes = new Map();
    // FIXME: https://github.com/foxglove/data-platform/issues/149
    for (const { topic, version, serializationFormat, schema } of rawTopics) {
      const datatypeName = version; //FIXME
      if (schema == undefined) {
        throw new Error(`missing requested schema for ${topic}`);
      }
      topics.push({ name: topic, datatype: datatypeName });
      const parsedDefinitions = parseMessageDefinition(schema, { ros2: false /*FIXME*/ });
      parsedDefinitions.forEach(({ name, definitions }, index) => {
        // The first definition usually doesn't have an explicit name,
        // so we get the name from the datatype.
        if (index === 0) {
          datatypes.set(datatypeName, { name: datatypeName, definitions });
        } else if (name != undefined) {
          datatypes.set(name, { name, definitions });
        }
      });
    }
    this._topics = topics;
    this._datatypes = datatypes;

    this._presence = PlayerPresence.PRESENT;
    this._emitState();
  };

  private _addProblem(
    id: string,
    problem: PlayerProblem,
    { skipEmit = false }: { skipEmit?: boolean } = {},
  ): void {
    this._problemsById.set(id, problem);
    this._problems = Array.from(this._problemsById.values());
    if (!skipEmit) {
      this._emitState();
    }
  }

  private _clearProblem(id: string, { skipEmit = false }: { skipEmit?: boolean } = {}): void {
    if (!this._problemsById.delete(id)) {
      return;
    }
    this._problems = Array.from(this._problemsById.values());
    if (!skipEmit) {
      this._emitState();
    }
  }

  // Potentially performance-sensitive; await can be expensive
  // eslint-disable-next-line @typescript-eslint/promise-function-async
  private _emitState = debouncePromise(() => {
    if (!this._listener || this._closed) {
      return Promise.resolve();
    }

    const messages = this._nextFrame;
    if (messages.length > 0) {
      this._nextFrame = [];
    }

    return this._listener({
      name: this._name,
      presence: this._presence,
      progress: this._progress,
      capabilities: CAPABILITIES,
      playerId: this._id,
      problems: this._problems,

      activeData: {
        messages,
        totalBytesReceived: this._totalBytesReceived,
        messageOrder: "receiveTime",
        startTime: this._start ?? ZERO_TIME,
        endTime: this._end ?? ZERO_TIME,
        currentTime: this._currentTime,
        isPlaying: this._isPlaying,
        speed: this._speed,
        lastSeekTime: this._lastSeekTime ?? 0,
        topics: this._topics,
        datatypes: this._datatypes,
        publishedTopics: undefined,
        subscribedTopics: undefined,
        services: undefined,
        parameters: undefined,
        parsedMessageDefinitionsByTopic: {},
      },
    });
  });

  setListener(listener: (arg0: PlayerState) => Promise<void>): void {
    this._listener = listener;
    this._emitState();
  }

  close(): void {
    this._closed = true;
    this._metricsCollector.close();
    this._totalBytesReceived = 0;
  }

  setSubscriptions(subscriptions: SubscribePayload[]): void {
    log.debug("setSubscriptions", subscriptions);
    this._requestedTopics = Array.from(new Set(subscriptions.map(({ topic }) => topic)));
    this._clearPreloadedData();
    this._startPreloadTaskIfNeeded();
    this._emitState();
  }

  private _runPlaybackLoop = debouncePromise(async () => {
    mainLoop: while (this._isPlaying) {
      await this._emitState.currentPromise;
      const frameDurationMs = 80; //FIXME: adaptive? support changing playback rate?
      const lastSeekTime = this._lastSeekTime;
      const startTime = this._currentTime;
      const endTime = clampTime(
        add(startTime, fromMillis(frameDurationMs)),
        this._start,
        this._end,
      );
      this._startPreloadTaskIfNeeded();
      let messages;
      while (
        !(messages = this._preloadedMessages.getMessages({ start: startTime, end: endTime }))
      ) {
        log.debug("Waiting for more messages");
        // Wait for new messages to be loaded
        await (this._loadedMoreMessages = signal());
        if (this._lastSeekTime !== lastSeekTime) {
          continue mainLoop;
        }
      }
      this._nextFrame = messages;
      this._currentTime = endTime;
      this._emitState();
    }
  });

  private _clearPreloadedData() {
    this._preloadedMessages.clear();
    this._progress = {
      fullyLoadedFractionRanges: this._preloadedMessages.fullyLoadedFractionRanges(),
    };
    this._currentPreloadTask?.abort();
    this._currentPreloadTask = undefined;
  }

  private _startPreloadTaskIfNeeded() {
    if (this._currentPreloadTask) {
      return;
    }
    const preloadedExtent = this._preloadedMessages.fullyLoadedExtent(this._currentTime);
    const shouldPreload =
      this._requestedTopics.length > 0 &&
      (!preloadedExtent ||
        toSec(subtract(preloadedExtent.end, this._currentTime)) < PRELOAD_THRESHOLD_SECS);
    if (!shouldPreload) {
      return;
    }

    const startTime = clampTime(preloadedExtent?.end ?? this._currentTime, this._start, this._end);
    const proposedEndTime = clampTime(
      add(startTime, fromSec(PRELOAD_DURATION_SECS)),
      this._start,
      this._end,
    );
    const endTime =
      this._preloadedMessages.fullyLoadedExtent(proposedEndTime)?.start ?? proposedEndTime;

    const thisTask = new AbortController();
    this._currentPreloadTask = thisTask;
    log.debug("Starting preload task");
    (async () => {
      const stream = streamMessages(this._consoleApi, thisTask.signal, {
        deviceId: this._deviceId,
        start: startTime,
        end: endTime,
        topics: this._requestedTopics,
      });

      for await (const { messages, range } of collateMessageStream(stream, {
        start: startTime,
        end: endTime,
      })) {
        log.debug("Adding preloaded chunk", range, messages);
        if (thisTask.signal.aborted) {
          break;
        }
        this._preloadedMessages.insert(messages, range);
        this._progress = {
          fullyLoadedFractionRanges: this._preloadedMessages.fullyLoadedFractionRanges(),
        };
        this._loadedMoreMessages?.resolve();
        this._loadedMoreMessages = undefined;
        this._emitState();
      }
    })()
      .catch((error) => {
        if (error.name === "AbortError") {
          log.debug("Preload task aborted");
          return;
        }
        log.error(error);
        this._addProblem("stream-error", { message: error.message, error, severity: "error" });
      })
      .finally(() => {
        if (this._currentPreloadTask === thisTask) {
          this._currentPreloadTask = undefined;
        }
      });

    this._emitState();
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
    this._isPlaying = true;
    this._runPlaybackLoop();
    this._emitState();
  }

  pausePlayback(): void {
    this._isPlaying = false;
    this._emitState();
  }

  seekPlayback(time: Time, _backfillDuration?: Time): void {
    this._currentTime = time;
    this._lastSeekTime = Date.now();
    this._nextFrame = [];
    this._currentPreloadTask?.abort();
    this._currentPreloadTask = undefined;
    this._startPreloadTaskIfNeeded();
    this._emitState();
  }

  setPlaybackSpeed(_speedFraction: number): void {
    // no-op
  }

  requestBackfill(): void {
    // no-op
  }

  setGlobalVariables(_globalVariables: GlobalVariables): void {
    // no-op
  }
}
