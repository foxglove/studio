// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as Comlink from "comlink";

import { abortSignalTransferHandler } from "@foxglove/comlink-transfer-handlers";
import { Immutable, MessageEvent } from "@foxglove/studio";

import { ComlinkTransferIteratorCursor } from "./ComlinkTransferIteratorCursor";
import type {
  GetBackfillMessagesArgs,
  IIterableSource,
  IMessageCursor,
  Initalization,
  IteratorResult,
  MessageIteratorArgs,
} from "./IIterableSource";
import { IteratorCursor } from "./IteratorCursor";

export class WorkerIterableSourceWorker<MessageType = unknown>
  implements IIterableSource<MessageType>
{
  protected _source: IIterableSource<MessageType>;
  protected _isRawSource;

  public constructor(source: IIterableSource<MessageType>, options?: { isRawSource?: boolean }) {
    this._source = source;
    this._isRawSource = options?.isRawSource ?? false;
  }

  public async initialize(): Promise<Initalization> {
    return await this._source.initialize();
  }

  public messageIterator(
    args: MessageIteratorArgs,
  ): AsyncIterableIterator<Readonly<IteratorResult<MessageType>>> & Comlink.ProxyMarked {
    return Comlink.proxy(this._source.messageIterator(args));
  }

  public async getBackfillMessages(
    args: Omit<GetBackfillMessagesArgs, "abortSignal">,
    // abortSignal is a separate argument so it can be proxied by comlink since AbortSignal is not
    // clonable (and needs to signal across the worker boundary)
    abortSignal?: AbortSignal,
  ): Promise<MessageEvent<MessageType>[]> {
    return await this._source.getBackfillMessages({
      ...args,
      abortSignal,
    });
  }

  public getMessageCursor(
    args: Omit<Immutable<MessageIteratorArgs>, "abort">,
    abort?: AbortSignal,
  ): IMessageCursor<MessageType> & Comlink.ProxyMarked {
    const iter = this._source.messageIterator(args);
    if (this._isRawSource) {
      const cursor = new ComlinkTransferIteratorCursor(
        new IteratorCursor<MessageType>(iter, abort),
      );
      return Comlink.proxy(cursor);
    } else {
      const cursor = new IteratorCursor<MessageType>(iter, abort);
      return Comlink.proxy(cursor);
    }
  }
}

Comlink.transferHandlers.set("abortsignal", abortSignalTransferHandler);
