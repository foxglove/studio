// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { IIterableSource } from "./IIterableSource";

export type Range = {
  /** inclusive */
  start: number;
  /** exclusive */
  end: number;
};

export type BufferInfo = {
  loadedRanges: Range[];
  cacheSizeInBytes: number;
};

export interface IBufferedIterableSource<MessageType = unknown>
  extends IIterableSource<MessageType> {
  stopProducer(): Promise<void>;

  getBufferInfo(): BufferInfo;

  subscribeToBufferingChanges(bufferInfoChangeHandler: (bufferInfo: BufferInfo) => void): {
    unsubscribe: () => void;
  };
}
