// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { DeserializingIterableSource } from "@foxglove/studio-base/players/IterablePlayer/DeserializingIterableSource";
import {
  BufferedRanges,
  IBufferedIterableSource,
  Range,
} from "@foxglove/studio-base/players/IterablePlayer/IBufferedIterableSource";

export class DeserializingBufferedIterableSource
  extends DeserializingIterableSource
  implements IBufferedIterableSource
{
  #bufferedSource: IBufferedIterableSource<Uint8Array>;

  public constructor(source: IBufferedIterableSource<Uint8Array>) {
    super(source);
    this.#bufferedSource = source;
  }

  public async stopProducer(): Promise<void> {
    await this.#bufferedSource.stopProducer();
  }

  public async getCacheSize(): Promise<number> {
    return await this.#bufferedSource.getCacheSize();
  }

  public async loadedRanges(): Promise<Range[]> {
    return await this.#bufferedSource.loadedRanges();
  }

  public async onLoadedRangesChange(
    rangeChangeHandler: (bufferedRanges: BufferedRanges) => void,
    options?: { minIntervalMs: number },
  ): Promise<void> {
    await this.#bufferedSource.onLoadedRangesChange?.(rangeChangeHandler, options);
  }
}
