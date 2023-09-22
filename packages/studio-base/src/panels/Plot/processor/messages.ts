// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as R from "ramda";

import { Messages } from "../internalTypes";
import { State, StateAndEffects, Client, SideEffects, rebuildClient } from "./state";
import { isSingleMessage } from "../params";
import { initAccumulated, accumulate } from "./accumulate";

export function evictCache(state: State): State {
  const { clients, blocks, current } = state;
  const topics = R.pipe(
    R.chain(({ topics: clientTopics }: Client) => clientTopics),
    R.uniq,
  )(clients);

  return {
    ...state,
    blocks: R.pick(topics, blocks),
    current: R.pick(topics, current),
  };
}

export function addBlock(block: Messages, resetTopics: string[], state: State): StateAndEffects {
  const { blocks, metadata, globalVariables, clients } = state;
  const topics = R.keys(block);

  const newBlocks = R.pipe(
    // Remove data for any topics that have been reset
    R.omit(resetTopics),
    // Merge the new block into the existing blocks
    (newBlocks) => R.mergeWith(R.concat, newBlocks, block),
  )(blocks);

  const clientChanges = clients.map((client): [Client, SideEffects] => {
    const { id, params } = client;
    const relevantTopics = R.intersection(topics, client.topics);
    const shouldReset = R.intersection(relevantTopics, resetTopics).length > 0;
    if (params == undefined || isSingleMessage(params) || relevantTopics.length === 0) {
      return [client, []];
    }

    return [
      {
        ...client,
        blocks: accumulate(
          metadata,
          globalVariables,
          shouldReset ? initAccumulated(client.topics) : client.blocks,
          params,
          blocks,
        ),
      },
      [rebuildClient(id)],
    ];
  });

  return [
    {
      ...state,
      blocks: newBlocks,
      clients: clientChanges.map(([v]) => v),
    },
    R.chain(([, v]) => v, clientChanges),
  ];
}
