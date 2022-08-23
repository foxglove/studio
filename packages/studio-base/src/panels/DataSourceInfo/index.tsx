// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Box, Divider, Typography } from "@mui/material";
import { cloneDeep } from "lodash";
import { useCallback, useMemo } from "react";
import { makeStyles } from "tss-react/mui";
import { useDebounce } from "use-debounce";

import { areEqual, subtract as subtractTimes, Time, toSec } from "@foxglove/rostime";
import { DataSourceInfo } from "@foxglove/studio-base/components/DataSourceInfo";
import EmptyState from "@foxglove/studio-base/components/EmptyState";
import { useMessagePipeline } from "@foxglove/studio-base/components/MessagePipeline";
import Panel from "@foxglove/studio-base/components/Panel";
import PanelToolbar from "@foxglove/studio-base/components/PanelToolbar";
import { Topic, TopicStats } from "@foxglove/studio-base/src/players/types";

import helpContent from "./index.help.md";

type TopicListItem = Topic & Partial<TopicStats> & { id: string; duration: Time };

const EMPTY_TOPICS: Topic[] = [];
const EMPTY_TOPIC_STATS = new Map<string, TopicStats>();

const useStyles = makeStyles()((theme) => ({
  grid: {
    display: "grid",
    gridTemplateColumns: "auto auto auto auto",
    overflowY: "auto",
  },
  gridCell: {
    paddingBlock: theme.spacing(1),
    paddingInline: theme.spacing(1.5),
  },
  gridRow: {
    display: "contents",
    "&:hover > *": {
      backgroundColor: theme.palette.background.paper,
    },
  },
  header: {
    paddingBlock: theme.spacing(1),
    paddingInline: theme.spacing(1.5),
  },
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
      whiteSpace: "nowrap",
    },
  },
}));

function formatItemFrequency(item: TopicListItem) {
  const { numMessages, firstMessageTime, lastMessageTime, duration } = item;

  if (numMessages == undefined) {
    // No message count, so no frequency
    return "–";
  }
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

function TopicRow({ item }: { item: TopicListItem }): JSX.Element {
  const { classes } = useStyles();

  return (
    <tr>
      <td className={classes.gridCell}>{item.name}</td>
      <td className={classes.gridCell}>{item.datatype}</td>
      <td className={classes.gridCell}>{item.numMessages?.toLocaleString() ?? "–"}</td>
      <td className={classes.gridCell}>{formatItemFrequency(item)}</td>
    </tr>
  );
}

const MemoTopicRow = React.memo(TopicRow);

function SourceInfo(): JSX.Element {
  const { classes } = useStyles();

  const topics = useMessagePipeline(
    useCallback((ctx) => ctx.playerState.activeData?.topics ?? EMPTY_TOPICS, []),
  );
  const topicStats = useMessagePipeline(
    useCallback((ctx) => ctx.playerState.activeData?.topicStats ?? EMPTY_TOPIC_STATS, []),
  );
  const startTime = useMessagePipeline(
    useCallback((ctx) => ctx.playerState.activeData?.startTime, []),
  );
  const endTime = useMessagePipeline(useCallback((ctx) => ctx.playerState.activeData?.endTime, []));

  const duration = endTime && startTime ? subtractTimes(endTime, startTime) : { sec: 0, nsec: 0 };

  const [debouncedData] = useDebounce(
    { topics, topicStats: cloneDeep(topicStats), duration, endTime },
    500,
    { leading: true, maxWait: 500 },
  );

  const detailListItems = useMemo<TopicListItem[]>(() => {
    return debouncedData.topics.map((topic) => {
      const stats = debouncedData.topicStats.get(topic.name);
      return {
        ...topic,
        ...stats,
        duration: debouncedData.duration,
        id: topic.name,
      };
    });
  }, [debouncedData.duration, debouncedData.topicStats, debouncedData.topics]);

  if (!startTime || !debouncedData.endTime) {
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
        <DataSourceInfo />
      </Box>
      <Divider />
      <table className={classes.table}>
        <thead>
          <tr>
            <th>Topic Name</th>
            <th>Datatype</th>
            <th>Message count</th>
            <th>Frequency</th>
          </tr>
        </thead>
        <tbody>
          {detailListItems.map((item) => (
            <MemoTopicRow key={item.name} item={item} />
          ))}
        </tbody>
      </table>
    </>
  );
}

SourceInfo.panelType = "SourceInfo";
SourceInfo.defaultConfig = {};

export default Panel(SourceInfo);
