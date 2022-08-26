// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

/**
 * A data event is a collection of metadata associated with a specific device,
 * timestamp and duration.
 */
export type DataEvent = {
  id: string;
  createdAt: string;
  deviceId: string;
  durationNanos: string;
  metadata: Record<string, string>;
  timestampNanos: string;
  updatedAt: string;
};
