// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { parseChannel } from "@foxglove/mcap-support";
import { MessageEvent } from "@foxglove/studio";
import {
  IIterableSource,
  Initalization,
  MessageIteratorArgs,
  IteratorResult,
  GetBackfillMessagesArgs,
} from "@foxglove/studio-base/players/IterablePlayer/IIterableSource";

export class DeserializingIterableSource implements IIterableSource {
  protected _source: IIterableSource<Uint8Array>;
  #deserializersBySchema: Record<string, (data: ArrayBufferView) => unknown> = {};

  public constructor(source: IIterableSource<Uint8Array>) {
    this._source = source;
  }

  #deserializeMessage(rawMessageEvent: MessageEvent<Uint8Array>): MessageEvent {
    const { schemaName, message } = rawMessageEvent;
    const deserialize = this.#deserializersBySchema[schemaName];
    if (!deserialize) {
      // ACHIM: Add problem or something like that?
      throw new Error(`Failed to find deserializer for schema ${schemaName}`);
    }

    return {
      ...rawMessageEvent,
      message: deserialize(message),
    };
  }

  public async initialize(): Promise<Initalization> {
    const initResult = await this._source.initialize();

    for (const topic of initResult.topics) {
      if (
        topic.messageEncoding != undefined &&
        topic.schemaData != undefined &&
        topic.schemaEncoding != undefined &&
        topic.schemaName != undefined &&
        this.#deserializersBySchema[topic.schemaName] == undefined
      ) {
        // ACHIM: Surround with try-catch and pass potential problems down the line.
        const { deserialize } = parseChannel({
          messageEncoding: topic.messageEncoding,
          schema: {
            data: topic.schemaData,
            encoding: topic.schemaEncoding,
            name: topic.schemaName,
          },
        });
        this.#deserializersBySchema[topic.schemaName] = deserialize;
      }
    }

    return initResult;
  }

  public messageIterator(
    args: MessageIteratorArgs,
  ): AsyncIterableIterator<Readonly<IteratorResult>> {
    // Rather than messageIterator itself being a generator, we return a generator function. This is
    // so the setup code above will run when the messageIterator is called rather than when .next()
    // is called the first time. This behavior is important because we want the producer to start
    // producing immediately.
    const rawIterator = this._source.messageIterator(args);
    const deserializersBySchema = this.#deserializersBySchema;
    return (async function* deserializedIterableGenerator() {
      try {
        for await (const iterResult of rawIterator) {
          if (iterResult.type === "message-event") {
            const { schemaName, message } = iterResult.msgEvent;
            const deserialize = deserializersBySchema[schemaName];
            if (!deserialize) {
              // ACHIM: Add problem or something like that?
              throw new Error(`Failed to find deserializer for schema ${schemaName}`);
            }

            const deserializedMessage = deserialize(message);

            yield {
              type: iterResult.type,
              msgEvent: { ...iterResult.msgEvent, message: deserializedMessage },
            };
          } else {
            yield iterResult;
          }
        }
      } finally {
        await rawIterator.return?.();
      }
    })();
  }

  public async getBackfillMessages(args: GetBackfillMessagesArgs): Promise<MessageEvent[]> {
    // An AbortSignal is not clonable, so we remove it from the args and send it as a separate argumet
    // to our worker getBackfillMessages call. Our installed Comlink handler for AbortSignal handles
    // making the abort signal available within the worker.

    const deserialize = (rawMessages: MessageEvent<Uint8Array>[]) => {
      return rawMessages.map((rawMsg) => this.#deserializeMessage(rawMsg));
    };
    return await this._source.getBackfillMessages(args).then(deserialize);
  }
}
