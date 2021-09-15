// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { v4 as uuidv4 } from "uuid";

import Logger from "@foxglove/log";
import { Time } from "@foxglove/rostime";
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
import { RosDatatypes } from "@foxglove/studio-base/types/RosDatatypes";
import debouncePromise from "@foxglove/studio-base/util/debouncePromise";

const log = Logger.getLogger(__filename);

const CAPABILITIES: string[] = [];

type FoxgloveDataPlatformPlayerOpts = {
  params: {
    start: string;
    end: string;
    seek?: string;
    org: string;
    deviceid: string;
  };
  metricsCollector: PlayerMetricsCollectorInterface;
};

export default class FoxgloveDataPlatformPlayer implements Player {
  private _id: string = uuidv4(); // Unique ID for this player
  private _listener?: (arg0: PlayerState) => Promise<void>; // Listener for _emitState()
  private _totalBytesReceived = 0;
  private _closed = false; // Whether the player has been completely closed using close()
  private _isPlaying = false;
  private _speed = 1;
  private _start?: Time;
  private _end?: Time;
  private _currentTime?: Time;
  private _lastSeekTime?: number;
  private _providerTopics?: Topic[];
  private _providerDatatypes: RosDatatypes = new Map();
  private _publishedTopics = new Map<string, Set<string>>(); // A map of topic names to the set of publisher IDs publishing each topic
  private _subscribedTopics = new Map<string, Set<string>>(); // A map of topic names to the set of subscriber IDs subscribed to each topic
  private _metricsCollector: PlayerMetricsCollectorInterface;
  private _presence: PlayerPresence = PlayerPresence.INITIALIZING;

  // track issues within the player
  private _problems: PlayerProblem[] = [];
  private _problemsById = new Map<string, PlayerProblem>();

  constructor({ params, metricsCollector }: FoxgloveDataPlatformPlayerOpts) {
    log.info(`initializing FoxgloveDataPlatformPlayer ${JSON.stringify(params)}`);
    this._metricsCollector = metricsCollector;
    this._metricsCollector.playerConstructed();
    void this._open();
  }

  private _open = async (): Promise<void> => {
    if (this._closed) {
      return;
    }
    this._presence = PlayerPresence.INITIALIZING;
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
      name: "FoxgloveDataPlatform",
      presence: this._presence,
      progress: {},
      capabilities: CAPABILITIES,
      playerId: this._id,
      problems: this._problems,

      activeData: {
        messages: [],
        totalBytesReceived: this._totalBytesReceived,
        messageOrder: "receiveTime",
        startTime: this._start ?? { sec: 0, nsec: 0 },
        endTime: this._end ?? { sec: 0, nsec: 0 },
        currentTime: this._currentTime ?? { sec: 0, nsec: 0 },
        isPlaying: this._isPlaying,
        speed: this._speed,
        lastSeekTime: this._lastSeekTime ?? 0,
        topics: [],
        datatypes: this._providerDatatypes,
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

  setSubscriptions(_subscriptions: SubscribePayload[]): void {}

  setPublishers(_publishers: AdvertiseOptions[]): void {
    // no-op
  }

  // Modify a remote parameter such as a rosparam.
  setParameter(_key: string, _value: ParameterValue): void {
    throw new Error(`Parameter modification is not supported for VelodynePlayer`);
  }

  publish(_request: PublishPayload): void {
    throw new Error(`Publishing is not supported for VelodynePlayer`);
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
