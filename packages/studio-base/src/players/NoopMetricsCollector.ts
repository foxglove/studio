// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
//
// This file incorporates work covered by the following copyright and
// permission notice:
//
//   Copyright 2018-2021 Cruise LLC
//
//   This source code is licensed under the Apache License, Version 2.0,
//   found at http://www.apache.org/licenses/LICENSE-2.0
//   You may not use this file except in compliance with the License.
import { Time } from "@foxglove/rostime";
import {
  PlayerMetricsCollectorInterface,
  SubscribePayload,
} from "@foxglove/studio-base/players/types";

export default class NoopMetricsCollector implements PlayerMetricsCollectorInterface {
  public setProperty(_key: string, _value: string | number | boolean): void {}
  public playerConstructed(): void {}
  public play(_speed: number): void {}
  public loop(): void {}
  public seek(_time: Time): void {}
  public setSpeed(_speed: number): void {}
  public pause(): void {}
  public close(): void {}
  public setSubscriptions(_subscriptions: SubscribePayload[]): void {}
  public recordPlaybackTime(_time: Time): void {}
  public recordBytesReceived(_bytes: number): void {}
  public recordDataProviderPerformance(): void {}
  public recordUncachedRangeRequest(): void {}
  public recordTimeToFirstMsgs(): void {}
  public recordDataProviderInitializePerformance(): void {}
  public recordDataProviderStall(): void {}
}
