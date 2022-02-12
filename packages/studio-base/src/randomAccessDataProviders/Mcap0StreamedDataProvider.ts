// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { isEqual } from "lodash";
import protobufjs from "protobufjs";
import descriptor from "protobufjs/ext/descriptor";
import decompressLZ4 from "wasm-lz4";

import { Mcap0StreamReader, Mcap0Types } from "@foxglove/mcap";
import { parse as parseMessageDefinition } from "@foxglove/rosmsg";
import { LazyMessageReader } from "@foxglove/rosmsg-serialization";
import { MessageReader as ROS2MessageReader } from "@foxglove/rosmsg2-serialization";
import {
  Time,
  compare,
  isLessThan,
  isGreaterThan,
  isTimeInRangeInclusive,
  fromNanoSec,
} from "@foxglove/rostime";
import { MessageEvent, Topic } from "@foxglove/studio-base/players/types";
import {
  RandomAccessDataProvider,
  ExtensionPoint,
  GetMessagesResult,
  GetMessagesTopics,
  InitializationResult,
  Connection,
} from "@foxglove/studio-base/randomAccessDataProviders/types";
import { RosDatatypes } from "@foxglove/studio-base/types/RosDatatypes";

type Options = { file: File };

export default class Mcap0StreamedDataProvider implements RandomAccessDataProvider {
  private options: Options;
  private messagesByChannel?: Map<number, MessageEvent<unknown>[]>;

  constructor(options: Options) {
    this.options = options;
  }

  async initialize(_extensionPoint: ExtensionPoint): Promise<InitializationResult> {
    const { file } = this.options;
    if (file.size > 1024 * 1024 * 1024) {
      throw new Error("Unable to stream MCAP file; too large");
    }
    await decompressLZ4.isLoaded;

    const streamReader = (file.stream() as ReadableStream<Uint8Array>).getReader();

    const messagesByChannel = new Map<number, MessageEvent<unknown>[]>();
    const schemasById = new Map<number, Mcap0Types.TypedMcapRecords["Schema"]>();
    const channelInfoById = new Map<
      number,
      {
        channel: Mcap0Types.Channel;
        schema: Mcap0Types.Schema;
        messageDeserializer: ROS2MessageReader | LazyMessageReader | protobufjs.Type;
      }
    >();

    let startTime: Time | undefined;
    let endTime: Time | undefined;
    function processRecord(record: Mcap0Types.TypedMcapRecord) {
      switch (record.type) {
        default:
          break;

        case "Schema": {
          const existingSchema = schemasById.get(record.id);
          if (existingSchema) {
            if (!isEqual(existingSchema, record)) {
              throw new Error(`differing schemas for id ${record.id}`);
            }
          }
          schemasById.set(record.id, record);
          break;
        }

        case "Channel": {
          const existingInfo = channelInfoById.get(record.id);
          if (existingInfo) {
            if (!isEqual(existingInfo.channel, record)) {
              throw new Error(`differing channel infos for id ${record.id}`);
            }
            break;
          }
          if (record.schemaId === 0) {
            throw new Error("Schemaless channels are not supported");
          }
          const schema = schemasById.get(record.schemaId);
          if (!schema) {
            throw new Error(
              `Encountered channel with schema id ${record.schemaId} but no prior schema`,
            );
          }

          //FIXME: use parseChannel
          let messageDeserializer;
          if (record.messageEncoding === "ros1" && schema.encoding === "ros1msg") {
            const parsedDefinitions = parseMessageDefinition(new TextDecoder().decode(schema.data));
            messageDeserializer = new LazyMessageReader(parsedDefinitions);
          } else if (record.messageEncoding === "ros2" && schema.encoding === "ros2msg") {
            const parsedDefinitions = parseMessageDefinition(
              new TextDecoder().decode(schema.data),
              {
                ros2: true,
              },
            );
            messageDeserializer = new ROS2MessageReader(parsedDefinitions);
          } else if (record.messageEncoding === "protobuf" && schema.encoding === "proto") {
            const descriptorMsg = descriptor.FileDescriptorSet.decode(schema.data);
            const MsgRoot = protobufjs.Root.fromDescriptor(descriptorMsg);
            const Deserializer = MsgRoot.root.lookupType(schema.name);
            messageDeserializer = Deserializer;
          } else {
            throw new Error(`unsupported message encoding ${record.messageEncoding}`);
          }
          channelInfoById.set(record.id, { channel: record, schema, messageDeserializer });
          messagesByChannel.set(record.id, []);
          break;
        }

        case "Message": {
          const channelId = record.channelId;
          const channelInfo = channelInfoById.get(channelId);
          const messages = messagesByChannel.get(channelId);
          if (!channelInfo || !messages) {
            throw new Error(`message for channel ${channelId} with no prior channel info`);
          }
          const receiveTime = fromNanoSec(record.logTime);
          if (!startTime || isLessThan(receiveTime, startTime)) {
            startTime = receiveTime;
          }
          if (!endTime || isGreaterThan(receiveTime, endTime)) {
            endTime = receiveTime;
          }

          if (channelInfo.messageDeserializer instanceof protobufjs.Type) {
            const protoMsg = channelInfo.messageDeserializer.decode(new Uint8Array(record.data));
            messages.push({
              topic: channelInfo.channel.topic,
              receiveTime,
              message: channelInfo.messageDeserializer.toObject(protoMsg, { defaults: true }),
              sizeInBytes: record.data.byteLength,
            });
          } else {
            messages.push({
              topic: channelInfo.channel.topic,
              receiveTime,
              message: channelInfo.messageDeserializer.readMessage(new Uint8Array(record.data)),
              sizeInBytes: record.data.byteLength,
            });
          }
          break;
        }
      }
    }

    const reader = new Mcap0StreamReader({
      decompressHandlers: {
        lz4: (buffer, decompressedSize) => decompressLZ4(buffer, Number(decompressedSize)),
      },
    });
    for (let result; (result = await streamReader.read()), !result.done; ) {
      reader.append(result.value);
      for (let record; (record = reader.nextRecord()); ) {
        processRecord(record);
      }
    }

    this.messagesByChannel = messagesByChannel;

    const topics: Topic[] = [];
    const connections: Connection[] = [];
    const datatypes: RosDatatypes = new Map([["TODO", { definitions: [] }]]);

    // FIXME
    for (const { channel, schema } of channelInfoById.values()) {
      topics.push({ name: channel.topic, datatype: schema.name });
      datatypes.set(schema.name, { definitions: [] });
    }

    return {
      start: startTime ?? { sec: 0, nsec: 0 },
      end: endTime ?? { sec: 0, nsec: 0 },
      topics,
      connections,
      providesParsedMessages: true,
      messageDefinitions: {
        type: "parsed",
        datatypes,
        messageDefinitionsByTopic: {},
        parsedMessageDefinitionsByTopic: {},
      },
      problems: [],
    };
  }

  async getMessages(
    start: Time,
    end: Time,
    subscriptions: GetMessagesTopics,
  ): Promise<GetMessagesResult> {
    if (!this.messagesByChannel) {
      throw new Error("initialization not completed");
    }
    const topics = subscriptions.parsedMessages;
    if (topics == undefined) {
      return {};
    }
    const topicsSet = new Set(topics);

    const parsedMessages: MessageEvent<unknown>[] = [];
    for (const messages of this.messagesByChannel.values()) {
      for (const message of messages) {
        if (
          isTimeInRangeInclusive(message.receiveTime, start, end) &&
          topicsSet.has(message.topic)
        ) {
          parsedMessages.push(message);
        }
      }
    }
    parsedMessages.sort((msg1, msg2) => compare(msg1.receiveTime, msg2.receiveTime));

    return { parsedMessages };
  }

  async close(): Promise<void> {}
}
