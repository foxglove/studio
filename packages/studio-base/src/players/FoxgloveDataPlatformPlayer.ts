// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { v4 as uuidv4 } from "uuid";

import Logger from "@foxglove/log";
import { parse as parseMessageDefinition, RosMsgDefinition } from "@foxglove/rosmsg";
import { fromDate, Time, toDate } from "@foxglove/rostime";
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
} from "@foxglove/studio-base/players/types";
import ConsoleApi from "@foxglove/studio-base/services/ConsoleApi";
import { RosDatatypes } from "@foxglove/studio-base/types/RosDatatypes";
import debouncePromise from "@foxglove/studio-base/util/debouncePromise";
import { formatTimeRaw } from "@foxglove/studio-base/util/time";

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
  private _currentTime?: Time;
  private _lastSeekTime?: number;
  private _topics: Topic[] = [];
  private _datatypes: RosDatatypes = new Map();
  private _metricsCollector: PlayerMetricsCollectorInterface;
  private _presence: PlayerPresence = PlayerPresence.INITIALIZING;

  // track issues within the player
  private _problems: PlayerProblem[] = [];
  private _problemsById = new Map<string, PlayerProblem>();

  constructor({ params, metricsCollector, consoleApi }: FoxgloveDataPlatformPlayerOpts) {
    log.info(`initializing FoxgloveDataPlatformPlayer ${JSON.stringify(params)}`);
    this._metricsCollector = metricsCollector;
    this._metricsCollector.playerConstructed();
    this._start = fromDate(new Date(params.start));
    this._end = fromDate(new Date(params.end));
    this._deviceId = params.deviceId;
    this._name = `${this._deviceId}, ${formatTimeRaw(this._start)} to ${formatTimeRaw(this._end)}`;
    this._consoleApi = consoleApi;
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

    return this._listener({
      name: this._name,
      presence: this._presence,
      progress: {},
      capabilities: CAPABILITIES,
      playerId: this._id,
      problems: this._problems,

      activeData: {
        messages: [],
        totalBytesReceived: this._totalBytesReceived,
        messageOrder: "receiveTime",
        startTime: this._start ?? ZERO_TIME,
        endTime: this._end ?? ZERO_TIME,
        currentTime: this._currentTime ?? ZERO_TIME,
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

  setSubscriptions(_subscriptions: SubscribePayload[]): void {
    log.debug("setSubscriptions", _subscriptions);
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
    // no-op
  }

  pausePlayback(): void {
    // no-op
  }

  seekPlayback(_time: Time, _backfillDuration?: Time): void {
    // no-op
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
