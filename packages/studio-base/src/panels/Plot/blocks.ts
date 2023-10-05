// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as R from "ramda";

import { MessageBlock } from "@foxglove/studio-base/PanelAPI/useBlocksSubscriptions";
import { SubscribePayload } from "@foxglove/studio-base/players/types";
import { Messages } from "./internalTypes";

// We need to keep track of the block data we've already sent to the worker and
// detect when it has changed, which can happen when the user changes a user
// script or they trigger a subscription to different fields.
// mapping from topic -> the first message on that topic in the block
type FirstMessages = Record<string, unknown>;
type Cursors = Record<string, number>;
export type BlockState = {
  // for each block, a mapping from topic -> the first message on that topic
  messages: FirstMessages[];
  // a mapping from topic -> the index of the last block we sent
  cursors: Cursors;
};

export const initBlockState = (): BlockState => ({
  messages: [],
  cursors: {},
});

export function refreshBlockTopics(
  subscriptions: SubscribePayload[],
  state: BlockState,
): BlockState {
  const { cursors, messages } = state;
  const topics = subscriptions.map((v) => v.topic);
  return {
    ...state,
    messages: R.map(
      (block) =>
        R.pipe(
          R.map((topic: string): [string, unknown] => [topic, block[topic]]),
          R.fromPairs,
        )(topics),
      messages,
    ),
    cursors: R.pipe(
      R.map((topic: string): [string, number] => [topic, cursors[topic] ?? 0]),
      R.fromPairs,
    )(topics),
  };
}

type Range = [start: number, end: number];
type Work = [SubscribePayload, [Range, boolean]];

export function processBlocks(
  blocks: readonly MessageBlock[],
  subscriptions: SubscribePayload[],
  state: BlockState,
): {
  state: BlockState;
  resetTopics: string[];
  newData: Messages[];
} {
  const { cursors } = state;
  const messages: FirstMessages[] = blocks.map((_, i) => state.messages[i] ?? {});
  const blocksWithStatuses = R.zip(blocks, messages);

  const work: Work[] = R.pipe(
    R.map((v: SubscribePayload): [send: Range, shouldReset: boolean] => {
      const { topic } = v;
      const currentCursor = cursors[topic] ?? 0;
      const newBlocks = R.takeWhile(
        (block) => block[topic] != undefined,
        blocks.slice(currentCursor),
      );
      const lastChanged = R.findLastIndex(([block, status]) => {
        const topicMessages = block[topic];
        if (topicMessages == undefined) {
          return false;
        }

        const oldFirst = status[topic];
        return !R.equals(oldFirst, topicMessages[0]?.message) && oldFirst != undefined;
      }, blocksWithStatuses);

      const endCursor = lastChanged !== -1 ? lastChanged + 1 : currentCursor + newBlocks.length;

      if (lastChanged !== -1 && lastChanged < currentCursor) {
        return [[0, endCursor], true];
      }

      return [[currentCursor, endCursor], false];
    }),
    R.zip(subscriptions),
    // filter out any topics that neither changed nor had new data
    R.filter(([, [[start, end], shouldReset]]) => shouldReset || start != end),
  )(subscriptions);

  const newMessages = R.reduce(
    (a: FirstMessages[], work: Work) => {
      const [{ topic }, [[start, end]]] = work;
      return R.pipe(
        (v: FirstMessages[]): [MessageBlock, FirstMessages][] => R.zip(blocks.slice(start, end), v),
        R.map(
          ([block, existing]: [MessageBlock, FirstMessages]): FirstMessages => ({
            ...existing,
            [topic]: block[topic]?.[0]?.message,
          }),
        ),
        R.concat(a.slice(0, start)),
        R.concat(R.__, a.slice(end)),
      )(a.slice(start, end));
    },
    messages,
    work,
  );

  const newCursors = R.reduce(
    (a: Cursors, [{ topic }, [[, end]]]: Work): Cursors => ({
      ...a,
      [topic]: end,
    }),
    cursors,
    work,
  );

  const newData: Messages[] = R.pipe(
    R.reduce(
      (a: string[][], v: [SubscribePayload, [Range, boolean]]): string[][] => {
        const [{ topic }, [[start, end]]] = v;
        for (let i = start; i < end; i++) {
          const bucket = a[i];
          if (bucket == undefined) {
            continue;
          }
          bucket.push(topic);
        }
        return a;
      },
      blocks.map((): string[] => []),
    ),
    R.zip(blocks),
    // remove all blocks that are empty or have no topics
    R.filter(([block, topics]) => !R.isEmpty(block) && topics.length > 0),
    R.map(([block, topics]) => R.pick(topics, block) as Messages),
  )(work);

  return {
    state: {
      messages: newMessages,
      cursors: newCursors,
    },
    resetTopics: R.chain(([{ topic }, [, shouldReset]]) => (shouldReset ? [topic] : []), work),
    newData,
  };
}
