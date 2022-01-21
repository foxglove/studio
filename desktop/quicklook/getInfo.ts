// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import decompressLZ4 from "wasm-lz4";

import {
  Mcap0StreamReader,
  McapPre0To0StreamReader,
  Mcap0Types,
  detectVersion,
  DETECT_VERSION_BYTES_REQUIRED,
} from "@foxglove/mcap";
import { Bag } from "@foxglove/rosbag";
import { BlobReader } from "@foxglove/rosbag/web";
import { Time, fromNanoSec, isLessThan, isGreaterThan } from "@foxglove/rostime";

export type TopicInfo = {
  topic: string;
  datatype: string;
  numMessages: number;
  numConnections: number;
};

export type FileInfo = {
  loadMoreInfo?: () => Promise<FileInfo>;
  fileType?: string | undefined;
  numChunks?: number;
  totalMessages?: number;
  startTime?: Time | undefined;
  endTime?: Time | undefined;
  topics?: TopicInfo[];
};

export async function getBagInfo(file: File): Promise<FileInfo> {
  const bag = new Bag(new BlobReader(file));
  await bag.open();
  const numMessagesByConnectionIndex = Array.from(bag.connections.values(), () => 0);
  let totalMessages = 0;
  for (const chunk of bag.chunkInfos) {
    for (const { conn, count } of chunk.connections) {
      numMessagesByConnectionIndex[conn] += count;
      totalMessages += count;
    }
  }

  const topicInfosByTopic = new Map<string, TopicInfo>();
  for (const { topic, type: datatype, conn } of bag.connections.values()) {
    const info = topicInfosByTopic.get(topic);
    if (info != undefined) {
      if (info.datatype !== datatype) {
        info.datatype = "(multiple)";
      }
      info.numMessages += numMessagesByConnectionIndex[conn] ?? 0;
      info.numConnections++;
    } else {
      topicInfosByTopic.set(topic, {
        topic,
        datatype: datatype ?? "(unknown)",
        numMessages: numMessagesByConnectionIndex[conn] ?? 0,
        numConnections: 1,
      });
    }
  }
  const topics = [...topicInfosByTopic.values()].sort((a, b) => a.topic.localeCompare(b.topic));
  return {
    fileType: undefined,
    totalMessages,
    numChunks: bag.chunkInfos.length,
    startTime: bag.startTime ?? undefined,
    endTime: bag.endTime ?? undefined,
    topics,
  };
}

export async function getMcapInfo(file: File): Promise<FileInfo> {
  const mcapVersion = detectVersion(
    new DataView(await file.slice(0, DETECT_VERSION_BYTES_REQUIRED).arrayBuffer()),
  );

  const decompressHandlers: Mcap0Types.DecompressHandlers = {
    lz4: (buffer, decompressedSize) => decompressLZ4(buffer, Number(decompressedSize)),
  };
  let mcapStreamReader: Mcap0Types.McapStreamReader;
  switch (mcapVersion) {
    case undefined:
      throw new Error("Not a valid MCAP file");
    case "0":
      // Try indexed read
      mcapStreamReader = new Mcap0StreamReader({
        includeChunks: true,
        decompressHandlers,
        validateCrcs: true,
      });
      return {
        loadMoreInfo: async () => await getStreamedMcapInfo(file, mcapStreamReader, "MCAP v0"),
        fileType: "MCAP v0",
      };

    case "pre0":
      mcapStreamReader = new McapPre0To0StreamReader({
        includeChunks: true,
        validateChunkCrcs: false,
        decompressHandlers,
      });
      return {
        loadMoreInfo: async () => await getStreamedMcapInfo(file, mcapStreamReader, "MCAP pre-v0"),
        fileType: "MCAP pre-v0",
      };
  }
}

async function getStreamedMcapInfo(
  file: File,
  mcapStreamReader: Mcap0Types.McapStreamReader,
  fileType: string,
): Promise<FileInfo> {
  let totalMessages = 0;
  let numChunks = 0;
  let startTime: Time | undefined;
  let endTime: Time | undefined;
  const topicInfosByTopic = new Map<string, TopicInfo & { connectionIds: Set<number> }>();
  const channelInfosById = new Map<number, Mcap0Types.TypedMcapRecords["ChannelInfo"]>();

  function processRecord(record: Mcap0Types.TypedMcapRecord) {
    switch (record.type) {
      default:
        return;

      case "Chunk":
        numChunks++;
        return;

      case "ChannelInfo": {
        channelInfosById.set(record.channelId, record);
        const info = topicInfosByTopic.get(record.topicName);
        if (info != undefined) {
          if (info.datatype !== record.schemaName) {
            info.datatype = "(multiple)";
          }
          if (!info.connectionIds.has(record.channelId)) {
            info.connectionIds.add(record.channelId);
            info.numConnections++;
          }
        } else {
          topicInfosByTopic.set(record.topicName, {
            topic: record.topicName,
            datatype: record.schemaName,
            numMessages: 0,
            numConnections: 1,
            connectionIds: new Set([record.channelId]),
          });
        }
        return;
      }

      case "Message": {
        const channel = channelInfosById.get(record.channelId);
        if (channel) {
          const info = topicInfosByTopic.get(channel.topicName);
          if (info != undefined) {
            info.numMessages++;
          }
        }
        totalMessages++;
        const timestamp = fromNanoSec(record.recordTime);
        if (!startTime || isLessThan(timestamp, startTime)) {
          startTime = timestamp;
        }
        if (!endTime || isGreaterThan(timestamp, endTime)) {
          endTime = timestamp;
        }
        return;
      }
    }
  }

  const streamReader = file.stream().getReader() as ReadableStreamDefaultReader<Uint8Array>;
  for (let result; (result = await streamReader.read()), !result.done; ) {
    mcapStreamReader.append(result.value);
    for (let record; (record = mcapStreamReader.nextRecord()); ) {
      processRecord(record);
    }
  }

  const topics = [...topicInfosByTopic.values()].sort((a, b) => a.topic.localeCompare(b.topic));
  return {
    fileType,
    totalMessages,
    numChunks,
    startTime,
    endTime,
    topics,
  };
}
