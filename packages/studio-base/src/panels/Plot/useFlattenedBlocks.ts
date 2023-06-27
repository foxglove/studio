// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { findLastIndex } from "lodash";
import { useMemo, useState } from "react";

import { forEachSortedArrays } from "@foxglove/den/collection";
import { compare } from "@foxglove/rostime";
import { Immutable as Im } from "@foxglove/studio";
import { MessageBlock, MessageEvent } from "@foxglove/studio-base/players/types";

function flattenBlocks(
  topics: readonly string[],
  blocksToProcess: Im<Array<undefined | MessageBlock>>,
): Im<MessageEvent[]> {
  const frames: MessageEvent[] = [];
  for (const block of blocksToProcess) {
    if (!block) {
      continue;
    }

    // Given that messagesByTopic should be in order by receiveTime, we need to combine
    // all of the messages into a single array and sorted by receive time.
    forEachSortedArrays(
      topics.map((topic) => block.messagesByTopic[topic] ?? []),
      (a, b) => compare(a.receiveTime, b.receiveTime),
      (messageEvent) => {
        frames.push(messageEvent);
      },
    );
  }

  return frames;
}

/**
 * Flattens incoming blocks into a single allFrames array.
 *
 * Internally this is implemented via a cursor and an accumulating array instead of
 * returning a new array on each invocation to improve performance.
 *
 * @param blocks blocks containing messages
 * @param topics to load from blocks
 * @returns flattened array of messages
 */
export function useFlattenedBlocks(
  params: Im<{
    blocks: Array<undefined | MessageBlock>;
    topics: string[];
  }>,
): Im<MessageEvent[]> {
  const { blocks, topics } = params;

  type State = Im<{
    allFrames: MessageEvent[];
    blocks: Array<undefined | MessageBlock>;
    cursor: number;
    topics: string[];
  }>;

  const [state, setState] = useState<State>({
    allFrames: [],
    blocks: [],
    cursor: 0,
    topics: [],
  });

  const memoryAvailable = useMemo(() => {
    if (state.allFrames.length >= 1_000_000) {
      // If we have memory stats we can let the user have more points as long as memory is
      // not under pressure.
      // foxglove-depcheck-used: @types/foxglove__web
      if (performance.memory) {
        const pct = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
        if (isNaN(pct) || pct > 0.6) {
          return false;
        }
      } else {
        return false;
      }
    }
    return true;
  }, [state.allFrames.length]);

  if (blocks !== state.blocks) {
    // setState directly here instead of a useEffect to avoid an extra render.
    setState((oldState) => {
      // If topics have changed start from a fresh state, otherwise append to our accumulating
      // allFrames.
      const resetAllFrames = blocks[0]?.messagesByTopic !== oldState.blocks[0]?.messagesByTopic;
      const newState: State = {
        allFrames: resetAllFrames ? [] : oldState.allFrames,
        blocks,
        cursor: resetAllFrames ? 0 : oldState.cursor,
        topics,
      };
      const lastReadyBlock = findLastIndex(blocks, (block) => block?.needTopics?.size === 0);
      if (newState.cursor <= lastReadyBlock && memoryAvailable) {
        const newFrames = flattenBlocks(topics, blocks.slice(newState.cursor, lastReadyBlock + 1));
        return {
          allFrames: newState.allFrames.concat(newFrames),
          blocks,
          cursor: lastReadyBlock + 1,
          topics,
        };
      } else {
        return newState;
      }
    });
  }

  return state.allFrames;
}
