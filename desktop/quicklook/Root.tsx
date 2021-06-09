// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useAsync } from "react-use";
import Bag, { Time, TimeUtil } from "rosbag";
import styled from "styled-components";

import Logger from "@foxglove/log";

import bagIcon from "../../resources/icon/BagIcon.png";
import formatByteSize from "./formatByteSize";

const log = Logger.getLogger(__filename);

type TopicInfo = { topic: string; datatype: string; numMessages: number };

type BagInfo = {
  name: string;
  size: number;
  totalMessages: number;
  startTime: Time | undefined;
  endTime: Time | undefined;
  topics: TopicInfo[];
};

function formatTimeRaw(stamp: Time): string {
  if (stamp.sec < 0 || stamp.nsec < 0) {
    log.error("Times are not allowed to be negative");
    return "(invalid negative time)";
  }
  return `${stamp.sec}.${stamp.nsec.toFixed().padStart(9, "0")}`;
}

async function getBagInfo(file: File): Promise<BagInfo> {
  const bag = await Bag.open(file);
  //log("Chunk info:  ",JSON.stringify(bag.chunkInfos, undefined, 2));
  //log("Connections: ",JSON.stringify(bag.connections, undefined, 2));
  /*
        path:        /home/ubuntu/testbags/markers.bag
        version:     2.0
        duration:    3.0s
        start:       May 03 2021 18:57:58.49 (1620068278.49)
        end:         May 03 2021 18:58:01.50 (1620068281.50)
        size:        15.1 KB
        messages:    10
        compression: none [1/1 chunks]
        types:       visualization_msgs/MarkerArray [d155b9ce5188fbaf89745847fd5882d7]
        topics:      /example_markers   10 msgs    : visualization_msgs/MarkerArray
        */
  const numMessagesByConnectionIndex = Array.from(bag.connections.values(), () => 0);
  let totalMessages = 0;
  for (const chunk of bag.chunkInfos) {
    for (const { conn, count } of chunk.connections) {
      numMessagesByConnectionIndex[conn] += count;
      totalMessages += count;
    }
  }

  const conns = [...bag.connections.values()].sort((a, b) => a.topic.localeCompare(b.topic));
  const topics: TopicInfo[] = [];
  for (const { topic, type: datatype, conn } of conns) {
    topics.push({
      topic,
      datatype: datatype ?? "(unknown)",
      numMessages: numMessagesByConnectionIndex[conn] ?? 0,
    });
  }
  return {
    name: file.name,
    size: file.size,
    totalMessages,
    startTime: bag.startTime ?? undefined,
    endTime: bag.endTime ?? undefined,
    topics,
  };
}

const SummaryRow = styled.div`
  margin: 2px 0;
  font-size: 14px;
  opacity: 0.75;
`;

const FileName = styled(SummaryRow)`
  opacity: 1;
  font-size: 18px;
  font-weight: bold;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-break: break-all;
  overflow: hidden;
`;

const TimeLabel = styled.span`
  display: inline-block;
  width: 40px;
`;

const MessageCount = styled.td`
  text-align: right;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  padding-right: 12px;
  opacity: 0.5;
`;

function TopicRow({ info: { topic, datatype, numMessages } }: { info: TopicInfo }) {
  return (
    <tr>
      <MessageCount>{numMessages.toLocaleString()}</MessageCount>
      <td style={{ width: 250, paddingRight: 10 }}>
        <code>{topic}</code>
      </td>
      <td style={{ fontSize: 12, opacity: 0.5 }}>{datatype}</td>
    </tr>
  );
}

function BagInfoDisplay({
  info: { name, size, totalMessages, startTime, endTime, topics },
}: {
  info: BagInfo;
}) {
  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          display: "flex",
          flexFlow: "row wrap",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <img src={bagIcon} style={{ width: 128 }} />
        <div style={{ display: "flex", flexDirection: "column", minWidth: 300, flex: "1 1 0" }}>
          <FileName>{name}</FileName>
          <SummaryRow>
            {totalMessages.toLocaleString()} {totalMessages === 1 ? "message" : "messages"},{" "}
            {formatByteSize(size)}
          </SummaryRow>
          {startTime && (
            <SummaryRow style={{ fontVariantNumeric: "tabular-nums" }}>
              <TimeLabel>Start:</TimeLabel>
              {TimeUtil.toDate(startTime).toLocaleString()} ({formatTimeRaw(startTime)})
            </SummaryRow>
          )}
          {endTime && (
            <SummaryRow style={{ fontVariantNumeric: "tabular-nums" }}>
              <TimeLabel>End:</TimeLabel>
              {TimeUtil.toDate(endTime).toLocaleString()} ({formatTimeRaw(endTime)})
            </SummaryRow>
          )}
        </div>
      </div>
      <table>
        <tbody>
          {topics.map((topicInfo, i) => (
            <TopicRow key={i} info={topicInfo} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Root(): JSX.Element {
  const state = useAsync(async () => {
    try {
      return getBagInfo(await quicklook.getPreviewedFile());
    } finally {
      await quicklook.finishedLoading();
    }
  }, []);

  return (
    <div>
      {state.error}
      {state.loading && "Loading…"}
      {state.value && <BagInfoDisplay info={state.value} />}
    </div>
  );
}
