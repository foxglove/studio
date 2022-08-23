// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useCallback, useEffect, useRef } from "react";
import { useLatest } from "react-use";

import { areEqual, Time, toSec } from "@foxglove/rostime";
import { Topic } from "@foxglove/studio";
import {
  MessagePipelineContext,
  useMessagePipeline,
} from "@foxglove/studio-base/components/MessagePipeline";
import { subtractTimes } from "@foxglove/studio-base/players/UserNodePlayer/nodeTransformerWorker/typescript/userUtils/time";
import { TopicStats } from "@foxglove/studio-base/players/types";

const EMPTY_TOPICS: Topic[] = [];
const EMPTY_TOPIC_STATS = new Map<string, TopicStats>();

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

const selectStartTime = ({ playerState }: MessagePipelineContext) =>
  playerState.activeData?.startTime;
const selectEndTime = ({ playerState }: MessagePipelineContext) => playerState.activeData?.endTime;

const selectTopics = (ctx: MessagePipelineContext) =>
  ctx.playerState.activeData?.topics ?? EMPTY_TOPICS;

const selectTopicStats = (ctx: MessagePipelineContext) =>
  ctx.playerState.activeData?.topicStats ?? EMPTY_TOPIC_STATS;

/**
 * Encapsulates logic for directly updating topic stats DOM elements, bypassing
 * react for performance.
 *
 * @param interval - the interval, in frames, between updates.
 */
export function useDirectTopicStatsUpdate(interval: number = 1): {
  countElements: Record<string, HTMLElement>;
  frequencyElements: Record<string, HTMLElement>;
} {
  const startTime = useMessagePipeline(selectStartTime);
  const endTime = useMessagePipeline(selectEndTime);
  const topics = useMessagePipeline(selectTopics);
  const topicStats = useMessagePipeline(selectTopicStats);
  const duration = endTime && startTime ? subtractTimes(endTime, startTime) : { sec: 0, nsec: 0 };

  const latestDuration = useLatest(duration);

  const countElements = useRef<Record<string, HTMLElement>>({});
  const frequencyElements = useRef<Record<string, HTMLElement>>({});

  const animCount = useRef(0);

  useEffect(() => {
    countElements.current = {};
    frequencyElements.current = {};
  }, [topics]);

  const animate = useCallback(
    (stats: Map<string, TopicStats>) => {
      stats.forEach((value, key) => {
        const countElem = countElements.current[key];
        if (countElem) {
          countElem.innerText = value.numMessages.toLocaleString();
        }
        const freqElem = frequencyElements.current[key];
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
    if (animCount.current++ % interval === 0) {
      animate(topicStats);
    }
  }, [animate, interval, topicStats]);

  return { countElements: countElements.current, frequencyElements: frequencyElements.current };
}
