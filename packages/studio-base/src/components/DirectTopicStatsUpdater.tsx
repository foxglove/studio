// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useLatest } from "react-use";

import { areEqual, Time, toSec } from "@foxglove/rostime";
import {
  MessagePipelineContext,
  useMessagePipeline,
} from "@foxglove/studio-base/components/MessagePipeline";
import { subtractTimes } from "@foxglove/studio-base/players/UserNodePlayer/nodeTransformerWorker/typescript/userUtils/time";
import { PlayerCapabilities, TopicStats } from "@foxglove/studio-base/players/types";

const EM_DASH = "\u2014";
const EMPTY_TOPIC_STATS = new Map<string, TopicStats>();

// Empirically this seems to strike a good balance between stable values
// and reasonably quick reactions to change.
function smoothValues(oldValue: number, newValue: number): number {
  return 0.8 * oldValue + 0.2 * newValue;
}

function calculateStaticItemFrequency(
  numMessages: number,
  firstMessageTime: undefined | Time,
  lastMessageTime: undefined | Time,
  duration: Time,
): undefined | number {
  // Message count but no timestamps, use the full connection duration
  if (firstMessageTime == undefined || lastMessageTime == undefined) {
    const durationSec = toSec(duration);
    if (durationSec > 0) {
      return numMessages / durationSec;
    } else {
      return undefined;
    }
  }

  // Not enough messages or time span to calculate a frequency
  if (numMessages < 2 || areEqual(firstMessageTime, lastMessageTime)) {
    return undefined;
  }

  const topicDurationSec = toSec(subtractTimes(lastMessageTime, firstMessageTime));
  if (topicDurationSec > 0) {
    return (numMessages - 1) / topicDurationSec;
  } else {
    return undefined;
  }
}

function calculateLiveitemFrequency(numMessages: number, duration: Time) {
  const durationSec = toSec(duration);

  return durationSec > 0 ? numMessages / durationSec : undefined;
}

const selectCurrentTime = ({ playerState }: MessagePipelineContext) =>
  playerState.activeData?.currentTime;
const selectStartTime = ({ playerState }: MessagePipelineContext) =>
  playerState.activeData?.startTime;
const selectEndTime = ({ playerState }: MessagePipelineContext) => playerState.activeData?.endTime;
const selectTopicStats = (ctx: MessagePipelineContext) =>
  ctx.playerState.activeData?.topicStats ?? EMPTY_TOPIC_STATS;
const selectPlayerId = (ctx: MessagePipelineContext) => ctx.playerState.playerId;
const selectPlayerCapabilities = (ctx: MessagePipelineContext) => ctx.playerState.capabilities;

/**
 * Encapsulates logic for directly updating topic stats DOM elements, bypassing
 * react for performance. To use this component mount it directly under your component
 * containing topics you want to update. Tag each topic stat field with data-topic
 * and data-topic-stat attributes.
 *
 * @property interval - the interval, in frames, between updates.
 */
export function DirectTopicStatsUpdater({ interval = 1 }: { interval?: number }): JSX.Element {
  const currentTime = useMessagePipeline(selectCurrentTime);
  const startTime = useMessagePipeline(selectStartTime);
  const endTime = useMessagePipeline(selectEndTime);
  const topicStats = useMessagePipeline(selectTopicStats);
  const playerCapabilities = useMessagePipeline(selectPlayerCapabilities);
  const playerId = useMessagePipeline(selectPlayerId);
  const duration = endTime && startTime ? subtractTimes(endTime, startTime) : { sec: 0, nsec: 0 };

  const previousCurrentTime = useRef(currentTime);
  const latestCurrentTime = useLatest(currentTime);
  const latestDuration = useLatest(duration);
  const latestStats = useLatest(topicStats);
  const updateCount = useRef(0);
  const rootRef = useRef<HTMLDivElement>(ReactNull);
  const previousMessageCounts = useRef<Record<string, number>>({});
  const previousMessageFrequencies = useRef<Record<string, undefined | number>>({});

  const playerIsStaticSource = useMemo(
    () => playerCapabilities.includes(PlayerCapabilities.playbackControl),
    [playerCapabilities],
  );

  const updateStats = useCallback(() => {
    if (!rootRef.current) {
      return;
    }

    rootRef.current.parentElement?.querySelectorAll("[data-topic]").forEach((field) => {
      if (field instanceof HTMLElement && field.dataset.topic) {
        const topic = field.dataset.topic;
        const stat = latestStats.current.get(topic);
        if (field.dataset.topicStat === "count") {
          if (stat) {
            field.innerText = stat.numMessages.toLocaleString();
          } else {
            field.innerText = EM_DASH;
          }
        }

        if (field.dataset.topicStat === "frequency") {
          if (stat && playerIsStaticSource) {
            // For a static source we calculate frequency across all messages.
            const frequency = calculateStaticItemFrequency(
              stat.numMessages,
              stat.firstMessageTime,
              stat.lastMessageTime,
              latestDuration.current,
            );
            field.innerText = frequency != undefined ? `${frequency.toFixed(2)} Hz` : EM_DASH;
          } else if (
            stat &&
            !playerIsStaticSource &&
            latestCurrentTime.current != undefined &&
            previousCurrentTime.current != undefined
          ) {
            // For a live source we calculate a running average of frequency.
            const messageDelta = stat.numMessages - (previousMessageCounts.current[topic] ?? 0);
            const timeDelta = subtractTimes(latestCurrentTime.current, previousCurrentTime.current);
            const newFrequency = calculateLiveitemFrequency(messageDelta, timeDelta);
            const oldFrequency = previousMessageFrequencies.current[topic];
            console.log(
              topic,
              oldFrequency?.toFixed(1),
              newFrequency?.toFixed(2),
              timeDelta,
              stat.numMessages,
            );
            if (newFrequency != undefined && oldFrequency != undefined) {
              // If we have a new and old value, interpolate and update display.
              const smoothedFrequency = smoothValues(oldFrequency, newFrequency);
              previousMessageFrequencies.current[topic] = smoothedFrequency;
              previousMessageCounts.current[topic] = stat.numMessages;
              previousCurrentTime.current = latestCurrentTime.current;
              field.innerText = `${smoothedFrequency.toFixed(2)} Hz`;
            } else if (newFrequency != undefined) {
              // If only a new value store it for the next update.
              previousMessageFrequencies.current[topic] = newFrequency;
              previousMessageCounts.current[topic] = stat.numMessages;
              previousCurrentTime.current = latestCurrentTime.current;
            } else {
              field.innerText = EM_DASH;
            }
          } else {
            field.innerText = EM_DASH;
          }
        }
      }
    });
  }, [latestCurrentTime, latestDuration, latestStats, playerIsStaticSource, previousCurrentTime]);

  useEffect(() => {
    if (updateCount.current++ % interval === 0) {
      updateStats();
    }
  }, [updateStats, interval, topicStats, playerIsStaticSource]);

  // Clear previous sample on player change.
  useEffect(() => {
    void playerId;
    previousMessageCounts.current = {};
    previousMessageFrequencies.current = {};
  }, [playerId]);

  useLayoutEffect(() => {
    updateStats();
  }, [updateStats]);

  return <div ref={rootRef} style={{ display: "none" }} />;
}
