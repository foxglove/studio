// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { pickFields } from "@foxglove/den/records";
import { parseChannel } from "@foxglove/mcap-support";
import { MessageEvent } from "@foxglove/studio";
import {
  MessageIteratorArgs,
  IteratorResult,
  GetBackfillMessagesArgs,
  IDeserializedIterableSource,
  Initalization,
  IIterableSource,
} from "@foxglove/studio-base/players/IterablePlayer/IIterableSource";
import { estimateObjectSize } from "@foxglove/studio-base/players/messageMemoryEstimation";

/**
 * Iterable source that deserializes messages from a raw iterable source (messages are Uint8Arrays).
 */
export class DeserializingIterableSource implements IDeserializedIterableSource {
  #source: IIterableSource<Uint8Array>;
  #deserializersByTopic: Record<string, (data: ArrayBufferView) => unknown> = {};
  #messageSizeEstimateByTopic: Record<string, number> = {};
  #connectionIdByTopic: Record<string, number> = {};

  public readonly sourceType = "deserialized";

  public constructor(source: IIterableSource<Uint8Array>) {
    this.#source = source;
  }

  public async initialize(): Promise<Initalization> {
    return this.initializeDeserializers(await this.#source.initialize());
  }

  public initializeDeserializers(initResult: Initalization): Initalization {
    const problems: Initalization["problems"] = [];

    let nextConnectionId = 0;
    for (const {
      name: topic,
      messageEncoding,
      schemaName,
      schemaData,
      schemaEncoding,
    } of initResult.topics) {
      this.#connectionIdByTopic[topic] = nextConnectionId++;

      if (this.#deserializersByTopic[topic] == undefined) {
        try {
          if (messageEncoding == undefined) {
            throw new Error(`Unspecified message encoding for topic ${topic}`);
          }

          const schema =
            schemaName != undefined && schemaData != undefined && schemaEncoding != undefined
              ? {
                  name: schemaName,
                  encoding: schemaEncoding,
                  data: schemaData,
                }
              : undefined;

          const { deserialize } = parseChannel({
            messageEncoding,
            schema,
          });
          this.#deserializersByTopic[topic] = deserialize;
        } catch (error) {
          // This should in practice never happen as the underlying source filters out invalid topics
          problems.push({
            severity: "error",
            message: `Error in topic ${topic}: ${error.message}`,
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
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const rawIterator = self.#source.messageIterator(args);
    return (async function* deserializedIterableGenerator() {
      try {
        for await (const iterResult of rawIterator) {
          if (iterResult.type !== "message-event") {
            yield iterResult;
            continue;
          }

          try {
            const fieldsToPick = args.topics.get(iterResult.msgEvent.topic)?.fields ?? [];
            const deserializedMsgEvent = self.#deserializeMessage(
              iterResult.msgEvent,
              fieldsToPick,
            );
            yield {
              type: iterResult.type,
              msgEvent: deserializedMsgEvent,
            };
          } catch (err) {
            const connectionId = self.#connectionIdByTopic[iterResult.msgEvent.topic] ?? 0;
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
    return await this.#source.getBackfillMessages(args).then(deserialize);
  }

  #deserializeMessage(
    rawMessageEvent: MessageEvent<Uint8Array>,
    fieldsToPick: string[],
  ): MessageEvent {
    const { topic, message } = rawMessageEvent;

    const deserialize = this.#deserializersByTopic[topic];
    if (!deserialize) {
      throw new Error(`Failed to find deserializer for topic ${topic}`);
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
