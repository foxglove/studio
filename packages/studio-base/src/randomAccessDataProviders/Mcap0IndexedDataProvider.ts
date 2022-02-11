// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Mcap0IndexedReader } from "@foxglove/mcap";
import { Time, fromNanoSec } from "@foxglove/rostime";
import { Topic } from "@foxglove/studio-base/players/types";
import {
  Connection,
  ExtensionPoint,
  GetMessagesResult,
  GetMessagesTopics,
  InitializationResult,
  RandomAccessDataProvider,
  RandomAccessDataProviderProblem,
} from "@foxglove/studio-base/randomAccessDataProviders/types";
import { RosDatatypes } from "@foxglove/studio-base/types/RosDatatypes";

export default class Mcap0IndexedDataProvider implements RandomAccessDataProvider {
  private messagesByChannel?: Map<number, MessageEvent<unknown>[]>;

  constructor(private reader: Mcap0IndexedReader) {}
  async initialize(_extensionPoint: ExtensionPoint): Promise<InitializationResult> {
    let startTime: bigint | undefined;
    let endTime: bigint | undefined;
    for (const chunk of this.reader.chunkIndexes) {
      if (startTime == undefined || chunk.startTime < startTime) {
        startTime = chunk.startTime;
      }
      if (endTime == undefined || chunk.endTime > endTime) {
        endTime = chunk.endTime;
      }
    }

    const topics: Topic[] = [];
    const connections: Connection[] = [];
    const datatypes: RosDatatypes = new Map([["TODO", { definitions: [] }]]);
    const problems: RandomAccessDataProviderProblem[] = [];

    for (const info of this.reader.channelInfosById.values()) {
      const schema = this.reader.schemasById.get(info.schemaId);
      if (schema == undefined) {
        problems.push({
          severity: "error",
          message: `Missing schema info for schema id ${info.schemaId} (channel ${info.id}, topic ${info.topic})`,
        });
        continue;
      }
      topics.push({ name: info.topic, datatype: schema.name });
      datatypes.set(schema.name, { definitions: [] });
    }

    return {
      start: fromNanoSec(startTime ?? 0n),
      end: fromNanoSec(endTime ?? startTime ?? 0n),
      topics,
      connections,
      providesParsedMessages: true,
      messageDefinitions: {
        type: "parsed",
        datatypes,
        messageDefinitionsByTopic: {},
        parsedMessageDefinitionsByTopic: {},
      },
      problems,
    };
  }

  async getMessages(
    start: Time,
    end: Time,
    subscriptions: GetMessagesTopics,
  ): Promise<GetMessagesResult> {
    const parsedMessages: MessageEvent<unknown>[] = [];
    for await (const message of this.reader.readMessages()) {
      const channel = this.reader.channelInfosById.get(message.channelId);
      const schema = this.reader.schemasById.get(channel.schemaId);
      parsedMessages.push(message);
    }
    return { parsedMessages };
  }

  async close(): Promise<void> {}
}
