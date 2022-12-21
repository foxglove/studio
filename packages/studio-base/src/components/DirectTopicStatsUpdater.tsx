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
function smoothValues(oldValue: undefined | number, newValue: number): number {
  return 0.7 * (oldValue ?? newValue) + 0.3 * newValue;
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

type StatSample = {
  time: Time;
  count: number;
  frequency: undefined | number;
};

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

  const latestCurrentTime = useLatest(currentTime);
  const latestDuration = useLatest(duration);
  const latestStats = useLatest(topicStats);
  const updateCount = useRef(0);
  const rootRef = useRef<HTMLDivElement>(ReactNull);
  const samples = useRef<Record<string, StatSample>>({});

  const playerIsStaticSource = useMemo(
    () => playerCapabilities.includes(PlayerCapabilities.playbackControl),
    [playerCapabilities],
  );

  const updateStats = useCallback(() => {
    if (!rootRef.current) {
      return;
    }

    rootRef.current.parentElement?.querySelectorAll("[data-topic]").forEach((field) => {
      if (!(field instanceof HTMLElement) || !field.dataset.topic) {
        return;
      }

      const topic = field.dataset.topic;
      const stat = latestStats.current.get(topic);
      if (field.dataset.topicStat === "count") {
        if (stat) {
          field.innerText = stat.numMessages.toLocaleString();
        } else {
          field.innerText = EM_DASH;
        }
      }

      const thisCurrentTime = latestCurrentTime.current;
      if (!thisCurrentTime) {
        return;
      }

      if (field.dataset.topicStat === "frequency") {
        if (playerIsStaticSource) {
          // For a static source we calculate frequency across all messages.
          if (stat == undefined) {
            field.innerText = EM_DASH;
          } else {
            const frequency = calculateStaticItemFrequency(
              stat.numMessages,
              stat.firstMessageTime,
              stat.lastMessageTime,
              latestDuration.current,
            );
            field.innerText = frequency != undefined ? `${frequency.toFixed(2)} Hz` : EM_DASH;
          }
        } else {
          // For a live source we calculate a running average of frequency.
          const sample = samples.current[topic];
          if (stat == undefined) {
            field.innerText = EM_DASH;
          } else if (sample == undefined) {
            samples.current[topic] = {
              time: thisCurrentTime,
              count: stat.numMessages,
              frequency: undefined,
            };
          } else {
            const messageDelta = stat.numMessages - sample.count;
            if (messageDelta > 0) {
              const timeDelta = subtractTimes(thisCurrentTime, sample.time);
              const newFrequency = calculateLiveitemFrequency(messageDelta, timeDelta);
              if (newFrequency != undefined) {
                const smoothedFrequency = smoothValues(sample.frequency, newFrequency);
                sample.frequency = smoothedFrequency;
                sample.count = stat.numMessages;
                sample.time = thisCurrentTime;
              }
            }
            field.innerText =
              sample.frequency != undefined ? `${sample.frequency.toFixed(2)} Hz` : EM_DASH;
          }
        }
      }
    });
  }, [latestCurrentTime, latestDuration, latestStats, playerIsStaticSource]);

  useEffect(() => {
    if (updateCount.current++ % interval === 0) {
      updateStats();
    }
  }, [updateStats, interval, topicStats, playerIsStaticSource]);

  // Clear previous samples on player change.
  useEffect(() => {
    void playerId;
    samples.current = {};
  }, [playerId]);

  useLayoutEffect(() => {
    updateStats();
  }, [updateStats]);

  return <div ref={rootRef} style={{ display: "none" }} />;
}
