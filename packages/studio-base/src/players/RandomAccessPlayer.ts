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
import { v4 as uuidv4 } from "uuid";

import { filterMap } from "@foxglove/den/collection";
import {
  Time,
  add,
  areEqual,
  compare,
  clampTime,
  fromMillis,
  percentOf,
  subtract as subtractTimes,
} from "@foxglove/rostime";
import NoopMetricsCollector from "@foxglove/studio-base/players/NoopMetricsCollector";
import {
  AdvertiseOptions,
  MessageEvent,
  Player,
  PlayerCapabilities,
  PlayerMetricsCollectorInterface,
  PlayerState,
  Progress,
  PublishPayload,
  SubscribePayload,
  Topic,
  ParsedMessageDefinitionsByTopic,
  PlayerPresence,
  ParameterValue,
  PlayerProblem,
} from "@foxglove/studio-base/players/types";
import { rootGetDataProvider } from "@foxglove/studio-base/randomAccessDataProviders/rootGetDataProvider";
import {
  Connection,
  RandomAccessDataProvider,
  RandomAccessDataProviderDescriptor,
  RandomAccessDataProviderMetadata,
} from "@foxglove/studio-base/randomAccessDataProviders/types";
import { RosDatatypes } from "@foxglove/studio-base/types/RosDatatypes";
import debouncePromise from "@foxglove/studio-base/util/debouncePromise";
import delay from "@foxglove/studio-base/util/delay";
import { isRangeCoveredByRanges } from "@foxglove/studio-base/util/ranges";
import { getSanitizedTopics } from "@foxglove/studio-base/util/selectors";
import {
  getSeekTimeFromSpec,
  SEEK_ON_START_NS,
  SeekToTimeSpec,
  TimestampMethod,
} from "@foxglove/studio-base/util/time";

// The number of nanoseconds to seek backwards to build context during a seek
// operation larger values mean more opportunity to capture context before the
// seek event, but are slower operations. We shouldn't make this number too big,
// otherwise we pull in too many unnecessary messages, making seeking slow. But
// we also don't want it to be too low, otherwise you don't see enough data when
// seeking.
// Unfortunately right now we need a pretty high number here, especially when
// using "synchronized topics" (e.g. in the Image panel) when one of the topics
// is publishing at a fairly low rate.
// TODO(JP): Add support for subscribers to express that we're only interested
// in the last message on a topic, and then support that in `getMessages` as
// well, so we can fetch pretty old messages without incurring the cost of
// fetching too many.
export const SEEK_BACK_NANOSECONDS =
  299 *
  /* ms */
  1e6;

if (SEEK_ON_START_NS >= SEEK_BACK_NANOSECONDS) {
  throw new Error(
    "SEEK_ON_START_NS should be less than SEEK_BACK_NANOSECONDS (otherwise we skip over messages at the start)",
  );
}

export const SEEK_START_DELAY_MS = 100;

const capabilities = [PlayerCapabilities.setSpeed, PlayerCapabilities.playbackControl];

export type RandomAccessPlayerOptions = {
  metricsCollector?: PlayerMetricsCollectorInterface;
  seekToTime: SeekToTimeSpec;
};

// A `Player` that wraps around a tree of `RandomAccessDataProviders`.
export default class RandomAccessPlayer implements Player {
  #label?: string;
  #filePath?: string;
  #provider: RandomAccessDataProvider;
  #isPlaying: boolean = false;
  #listener?: (arg0: PlayerState) => Promise<void>;
  #speed: number = 0.2;
  #start: Time = { sec: 0, nsec: 0 };
  #end: Time = { sec: 0, nsec: 0 };
  // next read start time indicates where to start reading for the next tick
  // after a tick read, it is set to 1nsec past the end of the read operation (preparing for the next tick)
  #nextReadStartTime: Time = { sec: 0, nsec: 0 };
  #lastTickMillis?: number;
  // The last time a "seek" was started. This is used to cancel async operations, such as seeks or ticks, when a seek
  // happens while they are ocurring.
  #lastSeekStartTime: number = Date.now();
  // This is the "lastSeekTime" emitted in the playerState. It is not the same as the _lastSeekStartTime because we can
  // start a seek and not end up emitting it, or emit something else while we are requesting messages for the seek. The
  // RandomAccessDataProvider's `progressCallback` can cause an emit at any time, for example.
  // We only want to set the "lastSeekTime" exactly when we emit the messages coming from the seek.
  #lastSeekEmitTime: number = this.#lastSeekStartTime;
  #cancelSeekBackfill: boolean = false;
  #parsedSubscribedTopics: Set<string> = new Set();
  #providerTopics: Topic[] = [];
  #providerConnections: Connection[] = [];
  #providerDatatypes: RosDatatypes = new Map();
  #metricsCollector: PlayerMetricsCollectorInterface;
  #initializing: boolean = true;
  #initialized: boolean = false;
  #reconnecting: boolean = false;
  #progress: Progress = Object.freeze({});
  #id: string = uuidv4();
  #messages: MessageEvent<unknown>[] = [];
  #receivedBytes: number = 0;
  #messageOrder: TimestampMethod = "receiveTime";
  #hasError = false;
  #closed = false;
  #seekToTime: SeekToTimeSpec;
  #lastRangeMillis?: number;
  #parsedMessageDefinitionsByTopic: ParsedMessageDefinitionsByTopic = {};

  // To keep reference equality for downstream user memoization cache the currentTime provided in the last activeData update
  // See additional comments below where _currentTime is set
  #currentTime?: Time;

  // The problem store holds problems based on keys (which may be hard-coded problem types or topics)
  // The overall player may be healthy, but individual topics may have warnings or errors.
  // These are set/cleared in the store to track the current set of problems
  #problems = new Map<string, PlayerProblem>();

  constructor(
    providerDescriptor: RandomAccessDataProviderDescriptor,
    { metricsCollector, seekToTime }: RandomAccessPlayerOptions,
  ) {
    this.#label = providerDescriptor.label;
    this.#filePath = providerDescriptor.filePath;
    if (process.env.NODE_ENV === "test" && providerDescriptor.name === "TestProvider") {
      this.#provider = providerDescriptor.args.provider;
    } else {
      this.#provider = rootGetDataProvider(providerDescriptor);
    }
    this.#metricsCollector = metricsCollector ?? new NoopMetricsCollector();
    this.#seekToTime = seekToTime;
    this.#metricsCollector.playerConstructed();
  }

  private _setError(message: string, error?: Error): void {
    this.#hasError = true;
    this.#problems.set("global-error", {
      severity: "error",
      message,
      error,
    });
    this.#isPlaying = false;
    if (!this.#initializing) {
      void this.#provider.close();
    }
    this.#emitState();
  }

  setListener(listener: (arg0: PlayerState) => Promise<void>): void {
    this.#listener = listener;
    this.#emitState();

    this.#provider
      .initialize({
        progressCallback: (progress: Progress) => {
          this.#progress = progress;
          // Don't emit progress when we are playing, because we will emit whenever we get new messages anyways and
          // emitting unnecessarily will reduce playback performance.
          if (!this.#isPlaying) {
            this.#emitState();
          }
        },
        reportMetadataCallback: (metadata: RandomAccessDataProviderMetadata) => {
          switch (metadata.type) {
            case "updateReconnecting":
              this.#reconnecting = metadata.reconnecting;

              this.#emitState();

              break;
            case "average_throughput":
              this.#metricsCollector.recordDataProviderPerformance(metadata);

              break;
            case "initializationPerformance":
              this.#metricsCollector.recordDataProviderInitializePerformance(metadata);

              break;
            case "received_bytes":
              this.#receivedBytes += metadata.bytes;
              break;
            case "data_provider_stall":
              this.#metricsCollector.recordDataProviderStall(metadata);

              break;
            default:
              break;
          }
        },
      })
      .then(({ start, end, topics, connections, messageDefinitions, providesParsedMessages }) => {
        if (!providesParsedMessages) {
          this._setError("Incorrect message format");
          return;
        }
        const parsedMessageDefinitions = messageDefinitions;
        if (parsedMessageDefinitions.type === "raw") {
          this._setError("Missing message definitions");
          return;
        }

        const initialTime = getSeekTimeFromSpec(this.#seekToTime, start, end);

        this.#start = start;
        this.#nextReadStartTime = initialTime;
        this.#end = end;
        this.#providerTopics = topics;
        this.#providerConnections = connections;
        this.#providerDatatypes = parsedMessageDefinitions.datatypes;
        this.#parsedMessageDefinitionsByTopic =
          parsedMessageDefinitions.parsedMessageDefinitionsByTopic;
        this.#initializing = false;
        this._reportInitialized();

        // Wait a bit until panels have had the chance to subscribe to topics before we start
        // playback.
        setTimeout(() => {
          if (this.#closed) {
            return;
          }
          // Only do the initial seek if we haven't started playing already.
          if (!this.#isPlaying && areEqual(this.#nextReadStartTime, initialTime)) {
            this.seekPlayback(initialTime);
          }
        }, SEEK_START_DELAY_MS);
      })
      .catch((error: Error) => {
        this._setError("Error initializing player", error);
      });
  }

  // Potentially performance-sensitive; await can be expensive
  // eslint-disable-next-line @typescript-eslint/promise-function-async
  #emitState = debouncePromise(() => {
    if (!this.#listener) {
      return Promise.resolve();
    }

    if (this.#hasError) {
      return this.#listener({
        name: this.#label,
        filePath: this.#filePath,
        presence: PlayerPresence.ERROR,
        progress: {},
        capabilities: [],
        playerId: this.#id,
        activeData: undefined,
        problems: Array.from(this.#problems.values()),
      });
    }

    const messages = this.#messages;
    this.#messages = [];
    if (messages.length > 0) {
      // If we're outputting any messages, we need to cancel any in-progress backfills. Otherwise
      // we'd be "traveling back in time".
      this.#cancelSeekBackfill = true;
    }

    // _nextReadStartTime points to the start of the _next_ range we want to read
    // for our player state, we want to have currentTime represent the last time of the range we read
    // It would be weird to provide a currentTime outside the bounds of what we read
    let lastEnd = this.#nextReadStartTime;
    if (lastEnd.sec > 0 || lastEnd.nsec > 0) {
      lastEnd = add(lastEnd, { sec: 0, nsec: -1 });
    }

    const publishedTopics = new Map<string, Set<string>>();
    for (const conn of this.#providerConnections) {
      let publishers = publishedTopics.get(conn.topic);
      if (publishers == undefined) {
        publishers = new Set<string>();
        publishedTopics.set(conn.topic, publishers);
      }
      publishers.add(conn.callerid);
    }

    // Downstream consumers of activeData rely on fields maintaining reference stability to detect changes
    // lastEnd is not stable due to the above TimeUtil.add which returns a new lastEnd value on ever call
    // Here we check if lastEnd is the same as the currentTime we've already set and avoid assigning
    // a new reference value to current time if the underlying time value is unchanged
    const clampedLastEnd = clampTime(lastEnd, this.#start, this.#end);
    if (!this.#currentTime || compare(this.#currentTime, clampedLastEnd) !== 0) {
      this.#currentTime = clampedLastEnd;
    }

    const data: PlayerState = {
      name: this.#label,
      filePath: this.#filePath,
      presence: this.#reconnecting
        ? PlayerPresence.RECONNECTING
        : this.#initializing
        ? PlayerPresence.INITIALIZING
        : PlayerPresence.PRESENT,
      progress: this.#progress,
      capabilities,
      playerId: this.#id,
      problems: this.#problems.size > 0 ? Array.from(this.#problems.values()) : undefined,
      activeData: this.#initializing
        ? undefined
        : {
            messages,
            totalBytesReceived: this.#receivedBytes,
            messageOrder: this.#messageOrder,
            currentTime: this.#currentTime,
            startTime: this.#start,
            endTime: this.#end,
            isPlaying: this.#isPlaying,
            speed: this.#speed,
            lastSeekTime: this.#lastSeekEmitTime,
            topics: this.#providerTopics,
            datatypes: this.#providerDatatypes,
            publishedTopics,
            parsedMessageDefinitionsByTopic: this.#parsedMessageDefinitionsByTopic,
          },
    };

    return this.#listener(data);
  });

  async _tick(): Promise<void> {
    if (this.#initializing || !this.#isPlaying || this.#hasError) {
      return;
    }

    // compute how long of a time range we want to read by taking into account
    // the time since our last read and how fast we're currently playing back
    const tickTime = performance.now();
    const durationMillis =
      this.#lastTickMillis != undefined && this.#lastTickMillis !== 0
        ? tickTime - this.#lastTickMillis
        : 20;
    this.#lastTickMillis = tickTime;

    // Read at most 300ms worth of messages, otherwise things can get out of control if rendering
    // is very slow. Also, smooth over the range that we request, so that a single slow frame won't
    // cause the next frame to also be unnecessarily slow by increasing the frame size.
    let rangeMillis = Math.min(durationMillis * this.#speed, 300);
    if (this.#lastRangeMillis != undefined) {
      rangeMillis = this.#lastRangeMillis * 0.9 + rangeMillis * 0.1;
    }
    this.#lastRangeMillis = rangeMillis;

    // read is past end of bag, no more to read
    if (compare(this.#nextReadStartTime, this.#end) > 0) {
      return;
    }

    const seekTime = this.#lastSeekStartTime;
    const start: Time = clampTime(this.#nextReadStartTime, this.#start, this.#end);
    const end: Time = clampTime(
      add(this.#nextReadStartTime, fromMillis(rangeMillis)),
      this.#start,
      this.#end,
    );

    const { parsedMessages: messages } = await this._getMessages(start, end);
    await this.#emitState.currentPromise;

    // if we seeked while reading then do not emit messages
    // just start reading again from the new seek position
    if (this.#lastSeekStartTime !== seekTime) {
      return;
    }

    // our read finished and we didn't seed during the read, prepare for the next tick
    // we need to do this after checking for seek changes since seek time may have changed
    this.#nextReadStartTime = add(end, { sec: 0, nsec: 1 });

    // if we paused while reading then do not emit messages
    // and exit the read loop
    if (!this.#isPlaying) {
      return;
    }

    this.#messages = this.#messages.concat(messages);
    this.#emitState();
  }

  #read = debouncePromise(async () => {
    try {
      while (this.#isPlaying && !this.#hasError) {
        const start = Date.now();
        await this._tick();
        const time = Date.now() - start;
        // make sure we've slept at least 16 millis or so (aprox 1 frame)
        // to give the UI some time to breathe and not burn in a tight loop
        if (time < 16) {
          await delay(16 - time);
        }
      }
    } catch (err) {
      this._setError(err.message, err);
    }
  });

  async _getMessages(start: Time, end: Time): Promise<{ parsedMessages: MessageEvent<unknown>[] }> {
    const parsedTopics = getSanitizedTopics(this.#parsedSubscribedTopics, this.#providerTopics);
    if (parsedTopics.length === 0) {
      return { parsedMessages: [] };
    }
    if (!this.hasCachedRange(start, end)) {
      this.#metricsCollector.recordUncachedRangeRequest();
    }
    const messages = await this.#provider.getMessages(start, end, {
      parsedMessages: parsedTopics,
    });
    const { parsedMessages } = messages;
    if (parsedMessages == undefined) {
      this.#problems.set("bad-messages", {
        severity: "error",
        message: `Bad set of messages`,
        tip: `Restart the app or contact support if the issue persists.`,
      });
      return { parsedMessages: [] };
    }
    this.#problems.delete("bad-messages");

    // It is very important that we record first emitted messages here, since
    // `_emitState` is awaited on `requestAnimationFrame`, which will not be
    // invoked unless a user's browser is focused on the current session's tab.
    // Moreover, there is a disproportionally small amount of time between when we procure
    // messages here and when they are set to playerState.
    if (parsedMessages.length > 0) {
      this.#metricsCollector.recordTimeToFirstMsgs();
    }
    const filterMessages = (msgs: readonly MessageEvent<unknown>[], topics: string[]) =>
      filterMap(msgs, (message) => {
        this.#problems.delete(message.topic);

        if (!topics.includes(message.topic)) {
          this.#problems.set(message.topic, {
            severity: "warn",
            message: `Unexpected topic encountered: ${message.topic}. Skipping message`,
          });
          return undefined;
        }
        const topic = this.#providerTopics.find((t) => t.name === message.topic);
        if (!topic) {
          this.#problems.set(message.topic, {
            severity: "warn",
            message: `Unexpected message on topic: ${message.topic}. Skipping message`,
          });
          return undefined;
        }
        if (topic.datatype === "") {
          this.#problems.set(message.topic, {
            severity: "warn",
            message: `Missing datatype for topic: ${message.topic}. Skipping message`,
          });
          return undefined;
        }

        return {
          topic: message.topic,
          receiveTime: message.receiveTime,
          message: message.message,
        };
      });
    return {
      parsedMessages: filterMessages(parsedMessages, parsedTopics),
    };
  }

  startPlayback(): void {
    if (this.#isPlaying) {
      return;
    }
    this.#metricsCollector.play(this.#speed);
    this.#isPlaying = true;
    this.#emitState();
    this.#read();
  }

  pausePlayback(): void {
    if (!this.#isPlaying) {
      return;
    }
    this.#metricsCollector.pause();
    // clear out last tick millis so we don't read a huge chunk when we unpause
    this.#lastTickMillis = undefined;
    this.#isPlaying = false;
    this.#emitState();
  }

  setPlaybackSpeed(speed: number): void {
    this.#lastRangeMillis = undefined;
    this.#speed = speed;
    this.#metricsCollector.setSpeed(speed);
    this.#emitState();
  }

  _reportInitialized(): void {
    if (this.#initializing || this.#initialized) {
      return;
    }
    this.#metricsCollector.initialized();
    this.#initialized = true;
  }

  _setNextReadStartTime(time: Time): void {
    this.#metricsCollector.recordPlaybackTime(time, {
      stillLoadingData: !this.hasCachedRange(this.#start, this.#end),
    });
    this.#nextReadStartTime = clampTime(time, this.#start, this.#end);
  }

  #seekPlaybackInternal = debouncePromise(async (backfillDuration?: Time) => {
    const seekTime = Date.now();
    this.#lastSeekStartTime = seekTime;
    this.#cancelSeekBackfill = false;
    // cancel any queued _emitState that might later emit messages from before we seeked
    this.#messages = [];

    // backfill includes the current time we've seek'd to
    // playback after backfill will load messages after the seek time
    const backfillEnd = clampTime(this.#nextReadStartTime, this.#start, this.#end);

    // Backfill a few hundred milliseconds of data if we're paused so panels have something to show.
    // If we're playing, we'll give the panels some data soon anyway.
    const internalBackfillDuration = { sec: 0, nsec: this.#isPlaying ? 0 : SEEK_BACK_NANOSECONDS };
    // Add on any extra time needed by the OrderedStampPlayer.
    const totalBackfillDuration = add(
      internalBackfillDuration,
      backfillDuration ?? { sec: 0, nsec: 0 },
    );
    const backfillStart = clampTime(
      subtractTimes(this.#nextReadStartTime, totalBackfillDuration),
      this.#start,
      this.#end,
    );

    // Only getMessages if we have some messages to get.
    if (backfillDuration || !this.#isPlaying) {
      const { parsedMessages: messages } = await this._getMessages(backfillStart, backfillEnd);
      // Only emit the messages if we haven't seeked again / emitted messages since we
      // started loading them. Note that for the latter part just checking for `isPlaying`
      // is not enough because the user might have started playback and then paused again!
      // Therefore we really need something like `this._cancelSeekBackfill`.
      if (this.#lastSeekStartTime === seekTime && !this.#cancelSeekBackfill) {
        // similar to _tick(), we set the next start time past where we have read
        // this happens after reading and confirming that playback or other seeking hasn't happened
        this.#nextReadStartTime = add(backfillEnd, { sec: 0, nsec: 1 });

        this.#messages = messages;
        this.#lastSeekEmitTime = seekTime;
        this.#emitState();
      }
    } else {
      // If we are playing, make sure we set this emit time so that consumers will know that we seeked.
      this.#lastSeekEmitTime = seekTime;
    }
  });

  seekPlayback(time: Time, backfillDuration?: Time): void {
    // Only seek when the provider initialization is done.
    if (!this.#initialized) {
      return;
    }
    this.#metricsCollector.seek(time);
    this._setNextReadStartTime(time);
    this.#seekPlaybackInternal(backfillDuration);
  }

  setSubscriptions(newSubscriptions: SubscribePayload[]): void {
    this.#parsedSubscribedTopics = new Set(newSubscriptions.map(({ topic }) => topic));
    this.#metricsCollector.setSubscriptions(newSubscriptions);
  }

  requestBackfill(): void {
    if (this.#isPlaying || this.#initializing || !this.#currentTime) {
      return;
    }
    this.seekPlayback(this.#currentTime);
  }

  setPublishers(_publishers: AdvertiseOptions[]): void {
    // no-op
  }

  setParameter(_key: string, _value: ParameterValue): void {
    throw new Error("Parameter editing is not supported by this data source");
  }

  publish(_payload: PublishPayload): void {
    throw new Error("Publishing is not supported by this data source");
  }

  close(): void {
    this.#isPlaying = false;
    this.#closed = true;
    if (!this.#initializing && !this.#hasError) {
      void this.#provider.close();
    }
    this.#metricsCollector.close();
  }

  // Exposed for testing.
  hasCachedRange(start: Time, end: Time): boolean {
    const fractionStart = percentOf(this.#start, this.#end, start);
    const fractionEnd = percentOf(this.#start, this.#end, end);
    return isRangeCoveredByRanges(
      { start: fractionStart, end: fractionEnd },
      this.#progress.fullyLoadedFractionRanges ?? [],
    );
  }

  setGlobalVariables(): void {
    // no-op
  }
}
