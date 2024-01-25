// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Immutable, Time } from "@foxglove/studio";
import {
  IIterableSource,
  Initalization,
  MessageIteratorArgs as IterableSourceMessageIteratorArgs,
  IteratorResult,
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

export type MessageIteratorArgs = IterableSourceMessageIteratorArgs & {
  bufferingType?: "buffered" | "unbuffered"; // Default is "buffered"
};

export interface IBufferedIterableSource extends IIterableSource {
  initialize(options?: InitalizationOptions): Promise<Initalization>;

  stopProducer(): Promise<void>;
  getCacheSize(): Promise<number>;
  loadedRanges(): Promise<Range[]>;

  messageIterator(
    args: Immutable<MessageIteratorArgs>,
  ): AsyncIterableIterator<Readonly<IteratorResult>>;

  onLoadedRangesChange?(
    rangeChangeHandler: (bufferedRanges: BufferedRanges) => void,
    options?: { minIntervalMs: number },
  ): Promise<void>;
}
