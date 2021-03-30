// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import amplitude from "amplitude-js";
import { Time } from "rosbag";
import { v4 as uuidv4 } from "uuid";

import OsContextSingleton from "@foxglove-studio/app/OsContextSingleton";
import type {
  PlayerMetricsCollectorInterface,
  SubscribePayload,
} from "@foxglove-studio/app/players/types";
import Storage from "@foxglove-studio/app/util/Storage";
import { toSec } from "@foxglove-studio/app/util/time";

const UUID_ZERO = "00000000-0000-0000-0000-000000000000";
const USER_ID_KEY = "analytics_user_id";

export enum AppEvent {
  APP_INIT = "APP_INIT",

  // PlayerMetricsCollectorInterface events
  PLAYER_CONSTRUCTED = "PLAYER_CONSTRUCTED",
  PLAYER_INITIALIZED = "PLAYER_INITIALIZED",
  PLAYER_PLAY = "PLAYER_PLAY",
  PLAYER_SEEK = "PLAYER_SEEK",
  PLAYER_SET_SPEED = "PLAYER_SET_SPEED",
  PLAYER_PAUSE = "PLAYER_PAUSE",
  PLAYER_CLOSE = "PLAYER_CLOSE",
}

export class Analytics implements PlayerMetricsCollectorInterface {
  private _amplitude?: amplitude.AmplitudeClient;
  private _storage = new Storage();

  constructor(options: { amplitudeApiKey: string | undefined }) {
    const amplitudeApiKey = options.amplitudeApiKey;
    if (amplitudeApiKey != undefined && amplitudeApiKey.length > 0) {
      const userId = this.getUserId();
      const deviceId = this.getDeviceId();
      const appVersion = this.getAppVersion();
      // eslint-disable-next-line no-restricted-syntax
      console.log(
        `Initializing analytics session as user ${userId}, device ${deviceId} (version ${appVersion})`,
      );
      this._amplitude = amplitude.getInstance();
      this._amplitude.init(amplitudeApiKey);
      this._amplitude.setUserId(userId);
      this._amplitude.setDeviceId(deviceId);
      this._amplitude.setVersionName(appVersion);
      this._amplitude.logEvent(AppEvent.APP_INIT);
    }
  }

  getAppVersion(): string {
    return OsContextSingleton?.getAppVersion() ?? "0.0.0";
  }

  getUserId(): string {
    let userId = this._storage.getItem<string>(USER_ID_KEY);
    if (userId == undefined) {
      userId = uuidv4();
      this._storage.setItem(USER_ID_KEY, userId);
    }
    return userId;
  }

  getDeviceId(): string {
    return OsContextSingleton?.getMachineId() ?? UUID_ZERO;
  }

  async logEvent(event: AppEvent, data?: unknown): Promise<void> {
    return new Promise((resolve) => {
      if (this._amplitude == undefined) {
        return resolve();
      }
      this._amplitude.logEvent(event, data, () => resolve());
    });
  }

  //////////////////////////////////////////////////////////////////////////////
  // PlayerMetricsCollectorInterface interface
  //////////////////////////////////////////////////////////////////////////////

  playerConstructed(): void {
    this.logEvent(AppEvent.PLAYER_CONSTRUCTED);
  }
  initialized(): void {
    this.logEvent(AppEvent.PLAYER_INITIALIZED);
  }
  play(speed: number): void {
    this.logEvent(AppEvent.PLAYER_PLAY, { speed });
  }
  seek(time: Time): void {
    this.logEvent(AppEvent.PLAYER_SEEK, { time: toSec(time) });
  }
  setSpeed(speed: number): void {
    this.logEvent(AppEvent.PLAYER_SET_SPEED, { speed });
  }
  pause(): void {
    this.logEvent(AppEvent.PLAYER_PAUSE);
  }
  close(): void {
    this.logEvent(AppEvent.PLAYER_CLOSE);
  }
  setSubscriptions(_subscriptions: SubscribePayload[]): void {}
  recordBytesReceived(_bytes: number): void {}
  recordPlaybackTime(_time: Time, _stillLoadingData: boolean): void {}
  recordDataProviderPerformance(
    _metadata: Readonly<{
      type: "average_throughput";
      totalSizeOfMessages: number;
      numberOfMessages: number;
      requestedRangeDuration: Time;
      receivedRangeDuration: Time;
      topics: readonly string[];
      totalTransferTime: Time;
    }>,
  ): void {}
  recordUncachedRangeRequest(): void {}
  recordTimeToFirstMsgs(): void {}
  recordDataProviderInitializePerformance(
    _metadata: Readonly<{
      type: "initializationPerformance";
      dataProviderType: string;
      metrics: { [metricName: string]: string | number };
    }>,
  ): void {}
  recordDataProviderStall(
    _metadata: Readonly<{
      type: "data_provider_stall";
      stallDuration: Time;
      requestTimeUntilStall: Time;
      transferTimeUntilStall: Time;
      bytesReceivedBeforeStall: number;
    }>,
  ): void {}
}
