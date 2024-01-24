// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { BufferedIterableSource } from "@foxglove/studio-base/players/IterablePlayer/BufferedIterableSource";
import {
  BufferedRanges,
  IBufferedIterableSource,
  Range,
} from "@foxglove/studio-base/players/IterablePlayer/IBufferedIterableSource";
import { WorkerIterableSourceWorker } from "@foxglove/studio-base/players/IterablePlayer/WorkerIterableSourceWorker";

import type { IIterableSource } from "./IIterableSource";

export class WorkerBufferedIterableSourceWorker
  extends WorkerIterableSourceWorker
  implements IBufferedIterableSource
{
  protected _bufferedSource: BufferedIterableSource;

  public constructor(source: IIterableSource) {
    const bufferedSource = new BufferedIterableSource(source);
    super(bufferedSource);
    this._bufferedSource = bufferedSource;
  }

  public async stopProducer(): Promise<void> {
    await this._bufferedSource.stopProducer();
  }

  public async getCacheSize(): Promise<number> {
    return await this._bufferedSource.getCacheSize();
  }

  public async loadedRanges(): Promise<Range[]> {
    return await this._bufferedSource.loadedRanges();
  }

  public async onLoadedRangesChange(
    rangeChangeHandler: (bufferedRanges: BufferedRanges) => void,
  ): Promise<void> {
    this._bufferedSource.on("loadedRangesChange", async () => {
      rangeChangeHandler({
        cacheSizeInBytes: await this._bufferedSource.getCacheSize(),
        ranges: await this._bufferedSource.loadedRanges(),
      });
    });
  }
}
