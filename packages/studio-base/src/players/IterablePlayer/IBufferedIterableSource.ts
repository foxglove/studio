// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

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

export type BufferedRanges = {
  ranges: Range[];
  cacheSizeInBytes: number;
};

export interface IBufferedIterableSource<MessageType = unknown>
  extends IIterableSource<MessageType> {
  // Initialize the source without initializing the underyling source which may already have been initialized.
  init(initResult: Initalization): void;

  stopProducer(): Promise<void>;

  getLoadedRanges(): BufferedRanges;

  subscribeToLoadedRangeChanges(rangeChangeHandler: (bufferedRanges: BufferedRanges) => void): {
    unsubscribe: () => void;
  };
}
