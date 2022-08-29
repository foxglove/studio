// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { range } from "lodash";

import { add, toNanoSec, toSec } from "@foxglove/rostime";
import { ConsoleEvent } from "@foxglove/studio-base/services/ConsoleApi";

// ts-prune-ignore-next
export function makeMockEvents(
  count: number,
  startSec: number = 100,
  stepSec: number = 1,
): ConsoleEvent[] {
  return range(0, count).map((idx) => {
    const startTime = { sec: idx * stepSec + startSec, nsec: 0 };
    const duration = { sec: (idx % 3) + 1, nsec: 0 };
    return {
      id: `event_${idx + 1}`,
      endTime: add(startTime, duration),
      endTimeInSeconds: toSec(add(startTime, duration)),
      startTime,
      startTimeInSeconds: toSec(startTime),
      timestampNanos: toNanoSec(startTime).toString(),
      metadata: {
        type: ["type A", "type B", "type C"][idx % 3]!,
        state: ["🤖", "🚎", "🚜"][idx % 3]!,
      },
      createdAt: new Date(2020, 1, 1).toISOString(),
      updatedAt: new Date(2020, 1, 1).toISOString(),
      deviceId: `device_${idx + 1}`,
      durationNanos: toNanoSec(duration).toString(),
    };
  });
}
