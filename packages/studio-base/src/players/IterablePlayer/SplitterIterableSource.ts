// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { MessageEvent } from "@foxglove/studio";
import {
  BufferedRanges,
  IBufferedIterableSource,
  MessageIteratorArgs,
  Range,
} from "@foxglove/studio-base/players/IterablePlayer/IBufferedIterableSource";
import {
  GetBackfillMessagesArgs,
  IIterableSource,
  Initalization,
  IteratorResult,
} from "@foxglove/studio-base/players/IterablePlayer/IIterableSource";

export class SplitterIterableSource<MessageType = unknown>
  implements IBufferedIterableSource<MessageType>
{
  #iterableSource: IIterableSource<MessageType>;
  #bufferedIterableSource: IBufferedIterableSource<MessageType>;

  public constructor(
    iterableSource: IIterableSource<MessageType>,
    bufferedIterableSource: IBufferedIterableSource<MessageType>,
  ) {
    this.#iterableSource = iterableSource;
    this.#bufferedIterableSource = bufferedIterableSource;
  }

  public async initialize(): Promise<Initalization> {
    return await this.#bufferedIterableSource.initialize();
  }

  public async getBackfillMessages(
    args: Omit<GetBackfillMessagesArgs, "abortSignal">,
    // abortSignal is a separate argument so it can be proxied by comlink since AbortSignal is not
    // clonable (and needs to signal across the worker boundary)
    abortSignal?: AbortSignal,
  ): Promise<MessageEvent<MessageType>[]> {
    return await this.#bufferedIterableSource.getBackfillMessages({
      ...args,
      abortSignal,
    });
  }

  public messageIterator(
    args: MessageIteratorArgs,
  ): AsyncIterableIterator<Readonly<IteratorResult<MessageType>>> {
    if (args.bufferingType) {
      return this.#iterableSource.messageIterator(args);
    } else {
      return this.#bufferedIterableSource.messageIterator(args);
    }
  }

  public async stopProducer(): Promise<void> {
    await this.#bufferedIterableSource.stopProducer();
  }

  public async getCacheSize(): Promise<number> {
    return await this.#bufferedIterableSource.getCacheSize();
  }

  public async loadedRanges(): Promise<Range[]> {
    return await this.#bufferedIterableSource.loadedRanges();
  }

  public async onLoadedRangesChange(
    rangeChangeHandler: (bufferedRanges: BufferedRanges) => void,
    options?: { minIntervalMs: number },
  ): Promise<void> {
    return await this.#bufferedIterableSource.onLoadedRangesChange?.(rangeChangeHandler, options);
  }
}
