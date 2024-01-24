// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as comlink from "comlink";

import {
  BufferedRanges,
  IBufferedIterableSource,
  Range,
} from "@foxglove/studio-base/players/IterablePlayer/IBufferedIterableSource";
import { WorkerIterableSource } from "@foxglove/studio-base/players/IterablePlayer/WorkerIterableSource";

import type { IterableSourceInitializeArgs } from "./IIterableSource";
import type { WorkerBufferedIterableSourceWorker } from "./WorkerBufferedIterableSourceWorker";

type ConstructorArgs = {
  initWorker: () => Worker;
  initArgs: IterableSourceInitializeArgs;
};

export class WorkerBufferedIterableSource
  extends WorkerIterableSource<WorkerBufferedIterableSourceWorker>
  implements IBufferedIterableSource
{
  public constructor(args: ConstructorArgs) {
    super(args);
  }

  public async stopProducer(): Promise<void> {
    await this._sourceWorkerRemote!.stopProducer();
  }

  public async getCacheSize(): Promise<number> {
    return await this._sourceWorkerRemote!.getCacheSize();
  }

  public async loadedRanges(): Promise<Range[]> {
    return await this._sourceWorkerRemote!.loadedRanges();
  }

  public async onLoadedRangesChange(
    rangeChangeHandler: (bufferedRanges: BufferedRanges) => void,
  ): Promise<void> {
    await this._sourceWorkerRemote?.onLoadedRangesChange(comlink.proxy(rangeChangeHandler));
  }
}
