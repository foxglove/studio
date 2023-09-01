// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useRef, useCallback } from "react";
import { useLatest } from "react-use";

import { useMessagePipelineSubscription } from "@foxglove/studio-base/components/MessagePipeline";
import { useTopicPublishFrequencies } from "@foxglove/studio-base/hooks/useTopicPublishFrequences";

const EN_DASH = "\u2013";

/** Number of frames to wait between updates of the DOM */
const UPDATE_INTERVAL_FRAMES = 6;

/**
 * Update topic stats information directly in the DOM to avoid the overhead of re-rendering.
 */
export function useDirectTopicStatsUpdate<ElementType extends HTMLElement>(
  topicName: string,
): {
  countRef: React.MutableRefObject<ElementType | ReactNull>;
  frequencyRef: React.MutableRefObject<ElementType | ReactNull>;
} {
  const frequencyRef = useRef<ElementType>(ReactNull);
  const countRef = useRef<ElementType>(ReactNull);
  const updateCount = useRef(0);
  const frequenciesByTopic = useTopicPublishFrequencies();
  const latestFrequenciesByTopic = useLatest(frequenciesByTopic);

  useMessagePipelineSubscription(
    useCallback(
      (state) => {
        const topicStats = state.playerState.activeData?.topicStats;
        if (!topicStats) {
          return;
        }
        if (updateCount.current++ % UPDATE_INTERVAL_FRAMES !== 0) {
          return;
        }

        const stats = topicStats.get(topicName);

        if (countRef.current) {
          countRef.current.innerText = stats?.numMessages.toLocaleString() ?? EN_DASH;
        }

        if (frequencyRef.current) {
          const frequency = latestFrequenciesByTopic.current[topicName];
          frequencyRef.current.innerText =
            frequency != undefined ? `${frequency.toFixed(2)} Hz` : EN_DASH;
        }
      },
      [countRef, frequencyRef, latestFrequenciesByTopic, topicName],
    ),
  );

  return { countRef, frequencyRef };
}
