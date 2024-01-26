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
import { estimateObjectSize } from "@foxglove/studio-base/players/messageMemoryEstimation";

export class DeserializingIterableSource implements IIterableSource {
  protected _source: IIterableSource<Uint8Array>;
  #deserializersBySchema: Record<string, (data: ArrayBufferView) => unknown> = {};
  #messageSizeEstimateByTopic: Record<string, number> = {};

  public constructor(source: IIterableSource<Uint8Array>) {
    this._source = source;
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
    const rawIterator = this._source.messageIterator(args);
    const deserializeMsgEvent = (msg: MessageEvent<Uint8Array>) => this.#deserializeMessage(msg);
    return (async function* deserializedIterableGenerator() {
      try {
        for await (const iterResult of rawIterator) {
          if (iterResult.type === "message-event") {
            try {
              const deserializedMsgEvent = deserializeMsgEvent(iterResult.msgEvent);
              yield {
                type: iterResult.type,
                msgEvent: deserializedMsgEvent,
              };
            } catch (err) {
              const connectionId = 1;
              yield {
                type: "problem",
                connectionId,
                problem: {
                  severity: "error",
                  message: `Failed to deserialize message on topic ${
                    iterResult.msgEvent.topic
                  }. ${err.toString()}`,
                  tip: `Check that your bag file is well-formed. It should have a connection record for every connection id referenced from a message record.`,
                },
              };
            }
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
    const deserialize = (rawMessages: MessageEvent<Uint8Array>[]) => {
      return rawMessages.map((rawMsg) => this.#deserializeMessage(rawMsg));
    };
    return await this._source.getBackfillMessages(args).then(deserialize);
  }

  #deserializeMessage(rawMessageEvent: MessageEvent<Uint8Array>): MessageEvent {
    const { schemaName, message } = rawMessageEvent;

    // ACHIM: Message slicing has to be added here
    const deserialize = this.#deserializersBySchema[schemaName];
    if (!deserialize) {
      // ACHIM: Add problem or something like that?
      throw new Error(`Failed to find deserializer for schema ${schemaName}`);
    }

    const deserializedMessage = deserialize(message);

    // Lookup the size estimate for this topic or compute it if not found in the cache.
    let msgSizeEstimate = this.#messageSizeEstimateByTopic[rawMessageEvent.topic];
    if (msgSizeEstimate == undefined) {
      msgSizeEstimate = estimateObjectSize(deserializedMessage);
      this.#messageSizeEstimateByTopic[rawMessageEvent.topic] = msgSizeEstimate;
    }

    return {
      ...rawMessageEvent,
      message: deserializedMessage,
      sizeInBytes: Math.max(message.byteLength, msgSizeEstimate),
    };
  }
}
