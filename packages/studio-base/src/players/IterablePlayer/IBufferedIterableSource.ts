// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Time } from "@foxglove/studio";
import {
  IIterableSource,
  Initalization,
} from "@foxglove/studio-base/players/IterablePlayer/IIterableSource";

export type Range = {
  /** inclusive */
  start: number;
  /** exclusive */
  end: number;
};

export type InitalizationOptions = {
  // How far ahead to buffer
  readAheadDuration?: Time;
  // The minimum duration to buffer before playback resumes
  minReadAheadDuration?: Time;
  // Max. cache size in bytes
  cacheSizeBytes?: number;
};

export type BufferedRanges = {
  ranges: Range[];
  cacheSizeInBytes: number;
};

export interface IBufferedIterableSource<MessageType = unknown>
  extends IIterableSource<MessageType> {
  initialize(options?: InitalizationOptions): Promise<Initalization>;

  stopProducer(): Promise<void>;

  getLoadedRanges(): BufferedRanges;

  subscribeToLoadedRangeChanges(rangeChangeHandler: (bufferedRanges: BufferedRanges) => void): {
    unsubscribe: () => void;
  };
}
