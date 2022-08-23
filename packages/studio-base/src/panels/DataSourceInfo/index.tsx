// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Box, Divider } from "@mui/material";
import { useCallback, useEffect, useRef } from "react";
import { useLatest } from "react-use";
import { makeStyles } from "tss-react/mui";

import { areEqual, subtract as subtractTimes, Time, toSec } from "@foxglove/rostime";
import { DataSourceInfoView } from "@foxglove/studio-base/components/DataSourceInfoView";
import EmptyState from "@foxglove/studio-base/components/EmptyState";
import {
  MessagePipelineContext,
  useMessagePipeline,
} from "@foxglove/studio-base/components/MessagePipeline";
import Panel from "@foxglove/studio-base/components/Panel";
import PanelToolbar from "@foxglove/studio-base/components/PanelToolbar";
import { Topic, TopicStats } from "@foxglove/studio-base/src/players/types";

import helpContent from "./index.help.md";

const EMPTY_TOPICS: Topic[] = [];
const EMPTY_TOPIC_STATS = new Map<string, TopicStats>();

const useStyles = makeStyles()((theme) => ({
  table: {
    borderCollapse: "collapse",
    display: "block",
    flex: 1,
    overflowY: "auto",

    thead: {
      position: "sticky",
      textAlign: "left",
      top: 0,
    },

    tr: {
      "&:hover": {
        backgroundColor: theme.palette.background.paper,
      },
    },

    th: {
      backgroundColor: theme.palette.background.paper,
      paddingBlock: theme.spacing(1),
      paddingInline: theme.spacing(1.5),
      whiteSpace: "nowrap",
      width: "100%",
    },

    td: {
      paddingBlock: theme.spacing(1),
      paddingInline: theme.spacing(1.5),
      whiteSpace: "nowrap",
    },
  },
}));

function formatItemFrequency(
  numMessages: number,
  firstMessageTime: undefined | Time,
  lastMessageTime: undefined | Time,
  duration: Time,
) {
  if (firstMessageTime == undefined || lastMessageTime == undefined) {
    // Message count but no timestamps, use the full connection duration
    return `${(numMessages / toSec(duration)).toFixed(2)} Hz`;
  }
  if (numMessages < 2 || areEqual(firstMessageTime, lastMessageTime)) {
    // Not enough messages or time span to calculate a frequency
    return "–";
  }
  const topicDurationSec = toSec(subtractTimes(lastMessageTime, firstMessageTime));
  return `${((numMessages - 1) / topicDurationSec).toFixed(2)} Hz`;
}

function TopicRow({
  countElements,
  freqElements,
  topic,
}: {
  countElements: Record<string, HTMLTableCellElement>;
  freqElements: Record<string, HTMLTableCellElement>;
  topic: Topic;
}): JSX.Element {
  return (
    <tr>
      <td>{topic.name}</td>
      <td>{topic.datatype}</td>
      <td
        ref={(elem) => {
          if (elem) {
            countElements[topic.name] = elem;
          }
        }}
      >
        &mdash;
      </td>
      <td
        ref={(elem) => {
          if (elem) {
            freqElements[topic.name] = elem;
          }
        }}
      >
        &mdash;
      </td>
    </tr>
  );
}

const selectTopics = (ctx: MessagePipelineContext) =>
  ctx.playerState.activeData?.topics ?? EMPTY_TOPICS;
const selectTopicStats = (ctx: MessagePipelineContext) =>
  ctx.playerState.activeData?.topicStats ?? EMPTY_TOPIC_STATS;
const selectStartTime = (ctx: MessagePipelineContext) => ctx.playerState.activeData?.startTime;
const selectEndTime = (ctx: MessagePipelineContext) => ctx.playerState.activeData?.endTime;

const MemoTopicRow = React.memo(TopicRow);

function SourceInfo(): JSX.Element {
  const { classes } = useStyles();

  const topics = useMessagePipeline(selectTopics);
  const topicStats = useMessagePipeline(selectTopicStats);
  const startTime = useMessagePipeline(selectStartTime);
  const endTime = useMessagePipeline(selectEndTime);

  const duration = endTime && startTime ? subtractTimes(endTime, startTime) : { sec: 0, nsec: 0 };

  const latestDuration = useLatest(duration);

  const rootRef = useRef<HTMLTableElement>(ReactNull);

  const countElements = useRef<Record<string, HTMLTableCellElement>>({});
  const freqElements = useRef<Record<string, HTMLTableCellElement>>({});

  const animCount = useRef(0);

  useEffect(() => {
    countElements.current = {};
    freqElements.current = {};
  }, [topics]);

  const animate = useCallback(
    (stats: Map<string, TopicStats>) => {
      stats.forEach((value, key) => {
        const countElem = countElements.current[key];
        if (countElem) {
          countElem.innerText = value.numMessages.toLocaleString();
        }
        const freqElem = freqElements.current[key];
        if (freqElem) {
          freqElem.innerText = formatItemFrequency(
            value.numMessages,
            value.firstMessageTime,
            value.lastMessageTime,
            latestDuration.current,
          );
        }
      });
    },
    [latestDuration],
  );

  useEffect(() => {
    if (animCount.current++ % 2 === 0) {
      animate(topicStats);
    }
  }, [animate, topicStats]);

  if (!startTime || !endTime) {
    return (
      <>
        <PanelToolbar helpContent={helpContent} />
        <EmptyState>Waiting for data...</EmptyState>
      </>
    );
  }

  return (
    <>
      <PanelToolbar helpContent={helpContent} />
      <Divider />
      <Box paddingTop={1}>
        <DataSourceInfoView />
      </Box>
      <Divider />
      <table className={classes.table} ref={rootRef}>
        <thead>
          <tr>
            <th>Topic Name</th>
            <th>Datatype</th>
            <th>Message count</th>
            <th>Frequency</th>
          </tr>
        </thead>
        <tbody>
          {topics.map((topic) => (
            <MemoTopicRow
              countElements={countElements.current}
              freqElements={freqElements.current}
              key={topic.name}
              topic={topic}
            />
          ))}
        </tbody>
      </table>
    </>
  );
}

SourceInfo.panelType = "SourceInfo";
SourceInfo.defaultConfig = {};

export default Panel(SourceInfo);
