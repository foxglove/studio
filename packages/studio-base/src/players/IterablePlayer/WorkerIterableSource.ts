// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as Comlink from "comlink";

import { abortSignalTransferHandler } from "@foxglove/comlink-transfer-handlers";
import { ComlinkWrap } from "@foxglove/den/worker";
import { Immutable, MessageEvent, Time } from "@foxglove/studio";
import { IWorkerIterableSource } from "@foxglove/studio-base/players/IterablePlayer/IWorkerIterableSource";

import type {
  GetBackfillMessagesArgs,
  IIterableSource,
  IMessageCursor,
  Initalization,
  IteratorResult,
  MessageIteratorArgs,
  IterableSourceInitializeArgs,
} from "./IIterableSource";
import type { WorkerIterableSourceWorker } from "./WorkerIterableSourceWorker";

Comlink.transferHandlers.set("abortsignal", abortSignalTransferHandler);

type ConstructorArgs = {
  initWorker: () => Worker;
  initArgs: IterableSourceInitializeArgs;
};

export class WorkerIterableSource<
  MessageType = unknown,
  T extends IWorkerIterableSource<MessageType> = WorkerIterableSourceWorker<MessageType>,
> implements IIterableSource<MessageType>
{
  readonly #args: ConstructorArgs;

  protected _sourceWorkerRemote?: Comlink.Remote<T>;
  protected _disposeRemote?: () => void;

  public constructor(args: ConstructorArgs) {
    this.#args = args;
  }

  public async initialize(): Promise<Initalization> {
    this._disposeRemote?.();

    // Note: this launches the worker.
    const worker = this.#args.initWorker();

    const { remote: initializeWorker, dispose } =
      ComlinkWrap<(args: IterableSourceInitializeArgs) => Comlink.Remote<T>>(worker);

    this._disposeRemote = dispose;
    this._sourceWorkerRemote = (await initializeWorker(this.#args.initArgs)) as Comlink.Remote<T>;
    return await this._sourceWorkerRemote.initialize();
  }

  public messageIterator(
    args: MessageIteratorArgs,
  ): AsyncIterableIterator<Readonly<IteratorResult<MessageType>>> {
    if (this._sourceWorkerRemote == undefined) {
      throw new Error(`WorkerIterableSource is not initialized`);
    }

    // Rather than messageIterator itself being a generator, we return a generator function. This is
    // so the setup code above will run when the messageIterator is called rather than when .next()
    // is called the first time. This behavior is important because we want the producer to start
    // producing immediately.

    const cursor = this.getMessageCursor(args);
    return (async function* bufferedIterableGenerator() {
      try {
        for (;;) {
          // The fastest framerate that studio renders at is 60fps. So to render a frame studio needs
          // at minimum ~16 milliseconds of messages before it will render a frame. Here we fetch
          // batches of 17 milliseconds so that one batch fetch could result in one frame render.
          // Fetching too much in a batch means we cannot render until the batch is returned.
          const results = await cursor.nextBatch(17 /* milliseconds */);
          if (!results || results.length === 0) {
            break;
          }
          yield* results;
        }
      } finally {
        await cursor.end();
      }
    })();
  }

  public async getBackfillMessages(
    args: GetBackfillMessagesArgs,
  ): Promise<MessageEvent<MessageType>[]> {
    if (this._sourceWorkerRemote == undefined) {
      throw new Error(`WorkerIterableSource is not initialized`);
    }

    // An AbortSignal is not clonable, so we remove it from the args and send it as a separate argumet
    // to our worker getBackfillMessages call. Our installed Comlink handler for AbortSignal handles
    // making the abort signal available within the worker.
    const { abortSignal, ...rest } = args;
    return await this._sourceWorkerRemote.getBackfillMessages(rest, abortSignal);
  }

  public getMessageCursor(
    args: Immutable<MessageIteratorArgs & { abort?: AbortSignal }>,
  ): IMessageCursor<MessageType> {
    if (this._sourceWorkerRemote == undefined) {
      throw new Error(`WorkerIterableSource is not initialized`);
    }

    // An AbortSignal is not clonable, so we remove it from the args and send it as a separate argumet
    // to our worker getBackfillMessages call. Our installed Comlink handler for AbortSignal handles
    // making the abort signal available within the worker.
    const { abort, ...rest } = args;
    const messageCursorPromise = this._sourceWorkerRemote.getMessageCursor(rest, abort);

    const cursor: IMessageCursor<MessageType> = {
      async next() {
        const messageCursor = await messageCursorPromise;
        return await messageCursor.next();
      },

      async nextBatch(durationMs: number) {
        const messageCursor = await messageCursorPromise;
        return await messageCursor.nextBatch(durationMs);
      },

      async readUntil(end: Time) {
        const messageCursor = await messageCursorPromise;
        return await messageCursor.readUntil(end);
      },

      async end() {
        const messageCursor = await messageCursorPromise;
        try {
          await messageCursor.end();
        } finally {
          messageCursor[Comlink.releaseProxy]();
        }
      },
    };

    return cursor;
  }

  public async terminate(): Promise<void> {
    this._disposeRemote?.();
    // shouldn't normally have to do this, but if `initialize` is called after again we don't want
    // to reuse the old remote
    this._disposeRemote = undefined;
    this._sourceWorkerRemote = undefined;
  }
}
