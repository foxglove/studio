// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
import * as Comlink from "comlink";
import * as _ from "lodash-es";

import { abortSignalTransferHandler } from "@foxglove/comlink-transfer-handlers";
import { Immutable, MessageEvent } from "@foxglove/studio";
import { BufferedIterableSource } from "@foxglove/studio-base/players/IterablePlayer/BufferedIterableSource";
import {
  BufferedRanges,
  IBufferedIterableSource,
  Range,
  MessageIteratorArgs,
} from "@foxglove/studio-base/players/IterablePlayer/IBufferedIterableSource";
import { IWorkerIterableSource } from "@foxglove/studio-base/players/IterablePlayer/IWorkerIterableSource";
import { IteratorCursor } from "@foxglove/studio-base/players/IterablePlayer/IteratorCursor";

import type {
  GetBackfillMessagesArgs,
  IIterableSource,
  IMessageCursor,
  Initalization,
  IteratorResult,
} from "./IIterableSource";

export class WorkerBufferedIterableSourceWorker
  implements IBufferedIterableSource, IWorkerIterableSource
{
  protected _unbufferedSource: IIterableSource;
  protected _bufferedSource: BufferedIterableSource;

  public constructor(source: IIterableSource) {
    this._unbufferedSource = source;
    this._bufferedSource = new BufferedIterableSource(source);
  }

  public async initialize(): Promise<Initalization> {
    return await this._bufferedSource.initialize();
  }

  public async getBackfillMessages(
    args: Omit<GetBackfillMessagesArgs, "abortSignal">,
    // abortSignal is a separate argument so it can be proxied by comlink since AbortSignal is not
    // clonable (and needs to signal across the worker boundary)
    abortSignal?: AbortSignal,
  ): Promise<MessageEvent[]> {
    return await this._bufferedSource.getBackfillMessages({
      ...args,
      abortSignal,
    });
  }

  public messageIterator(
    args: MessageIteratorArgs,
  ): AsyncIterableIterator<Readonly<IteratorResult>> & Comlink.ProxyMarked {
    if (args.bufferingType) {
      return Comlink.proxy(this._unbufferedSource.messageIterator(args));
    } else {
      return Comlink.proxy(this._bufferedSource.messageIterator(args));
    }
  }

  public getMessageCursor(
    args: Omit<Immutable<MessageIteratorArgs>, "abort">,
    abort?: AbortSignal,
  ): IMessageCursor & Comlink.ProxyMarked {
    const iter = args.bufferingType
      ? this._unbufferedSource.messageIterator(args)
      : this._bufferedSource.messageIterator(args);
    const cursor = new IteratorCursor(iter, abort);
    return Comlink.proxy(cursor);
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
    options?: { minIntervalMs: number },
  ): Promise<void> {
    const throttledEventHandler = _.throttle(
      async () => {
        rangeChangeHandler({
          cacheSizeInBytes: await this._bufferedSource.getCacheSize(),
          ranges: await this._bufferedSource.loadedRanges(),
        });
      },
      options?.minIntervalMs ?? 50,
    );
    this._bufferedSource.on("loadedRangesChange", throttledEventHandler);
  }
}

Comlink.transferHandlers.set("abortsignal", abortSignalTransferHandler);
