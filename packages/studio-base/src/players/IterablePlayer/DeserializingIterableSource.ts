// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { pickFields } from "@foxglove/den/records";
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
  #connectionIdByTopic: Record<string, number> = {};

  public constructor(source: IIterableSource<Uint8Array>) {
    this._source = source;
  }

  public async initialize(): Promise<Initalization> {
    return this.initializeDeserializers(await this._source.initialize());
  }

  protected initializeDeserializers(initResult: Initalization): Initalization {
    const problems: Initalization["problems"] = [];
    let nextConnectionId = 0;
    for (const topic of initResult.topics) {
      this.#connectionIdByTopic[topic.name] = nextConnectionId++;

      if (
        topic.messageEncoding != undefined &&
        topic.schemaData != undefined &&
        topic.schemaEncoding != undefined &&
        topic.schemaName != undefined &&
        this.#deserializersBySchema[topic.schemaName] == undefined
      ) {
        try {
          const { deserialize } = parseChannel({
            messageEncoding: topic.messageEncoding,
            schema: {
              data: topic.schemaData,
              encoding: topic.schemaEncoding,
              name: topic.schemaName,
            },
          });
          this.#deserializersBySchema[topic.schemaName] = deserialize;
        } catch (error) {
          // This should in practice never happen as the underlying source filters out invalid topics
          problems.push({
            severity: "error",
            message: `Error in topic ${topic.name}: ${error.message}`,
            error,
          });
        }
      }
    }

    return { ...initResult, problems: initResult.problems.concat(problems) };
  }

  public messageIterator(
    args: MessageIteratorArgs,
  ): AsyncIterableIterator<Readonly<IteratorResult>> {
    const rawIterator = this._source.messageIterator(args);
    const deserializeMsgEvent = (msg: MessageEvent<Uint8Array>, fieldsToPick: string[]) =>
      this.#deserializeMessage(msg, fieldsToPick);
    const connectionIdByTopic = this.#connectionIdByTopic;
    return (async function* deserializedIterableGenerator() {
      try {
        for await (const iterResult of rawIterator) {
          if (iterResult.type !== "message-event") {
            yield iterResult;
            continue;
          }

          try {
            const fieldsToPick = args.topics.get(iterResult.msgEvent.topic)?.fields ?? [];
            const deserializedMsgEvent = deserializeMsgEvent(iterResult.msgEvent, fieldsToPick);
            yield {
              type: iterResult.type,
              msgEvent: deserializedMsgEvent,
            };
          } catch (err) {
            const connectionId = connectionIdByTopic[iterResult.msgEvent.topic] ?? 0;
            yield {
              type: "problem",
              connectionId,
              problem: {
                severity: "error",
                message: `Failed to deserialize message on topic ${
                  iterResult.msgEvent.topic
                }. ${err.toString()}`,
                tip: `Check that your input file is not corrupted.`,
              },
            };
          }
        }
      } finally {
        await rawIterator.return?.();
      }
    })();
  }

  public async getBackfillMessages(args: GetBackfillMessagesArgs): Promise<MessageEvent[]> {
    const deserialize = (rawMessages: MessageEvent<Uint8Array>[]) => {
      return rawMessages.map((rawMsg) => {
        const fieldsToPick = args.topics.get(rawMsg.topic)?.fields ?? [];
        return this.#deserializeMessage(rawMsg, fieldsToPick);
      });
    };
    return await this._source.getBackfillMessages(args).then(deserialize);
  }

  #deserializeMessage(
    rawMessageEvent: MessageEvent<Uint8Array>,
    fieldsToPick: string[],
  ): MessageEvent {
    const { schemaName, message } = rawMessageEvent;

    const deserialize = this.#deserializersBySchema[schemaName];
    if (!deserialize) {
      throw new Error(`Failed to find deserializer for schema ${schemaName}`);
    }

    const deserializedMessage = deserialize(message) as Record<string, unknown>;
    const msg =
      fieldsToPick.length > 0 ? pickFields(deserializedMessage, fieldsToPick) : deserializedMessage;

    // Lookup the size estimate for this topic or compute it if not found in the cache.
    let msgSizeEstimate = this.#messageSizeEstimateByTopic[rawMessageEvent.topic];
    if (msgSizeEstimate == undefined) {
      msgSizeEstimate = estimateObjectSize(msg);
      this.#messageSizeEstimateByTopic[rawMessageEvent.topic] = msgSizeEstimate;
    }

    return {
      ...rawMessageEvent,
      message: msg,
      sizeInBytes: Math.max(message.byteLength, msgSizeEstimate),
    };
  }
}
