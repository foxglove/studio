// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as R from "ramda";

import { MessageEvent } from "@foxglove/studio-base/players/types";
import { Messages } from "../internalTypes";
import {
  State,
  StateAndEffects,
  Client,
  SideEffects,
  rebuildClient,
  sendData,
  sendPartial,
  mapClients,
  noEffects,
  appendEffects,
  keepEffects,
} from "./state";
import { isSingleMessage } from "../params";
import { initAccumulated, accumulate, getNewMessages, buildPlot } from "./accumulate";
import { appendPlotData } from "../plotData";

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
  const { blocks, metadata, globalVariables } = state;
  const topics = R.keys(block);

  const newState = {
    ...state,
    blocks: R.pipe(
      // Remove data for any topics that have been reset
      R.omit(resetTopics),
      // Merge the new block into the existing blocks
      (newBlocks) => R.mergeWith(R.concat, newBlocks, block),
    )(blocks),
  };

  return mapClients((client): [Client, SideEffects] => {
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
  })(newState);
}

const updateLiveClients = mapClients((client, state): [Client, SideEffects] => {
  const { current, metadata, globalVariables } = state;
  const { id, params } = client;
  if (params == undefined) {
    return noEffects(client);
  }

  if (isSingleMessage(params)) {
    const plotData = buildPlot(
      metadata,
      globalVariables,
      params,
      R.map((messages) => messages.slice(-1), current),
    );

    return [client, [sendData(id, plotData)]];
  }

  return [
    {
      ...client,
      current: accumulate(metadata, globalVariables, client.current, params, current),
    },
    [rebuildClient(id)],
  ];
});

const updateRecordedClients = mapClients((client, state): [Client, SideEffects] => {
  const { current, metadata, globalVariables } = state;
  const { id, params, current: previous } = client;
  if (params == undefined) {
    return noEffects(client);
  }

  const { cursors: oldCursors, data: oldData } = previous;
  const [newCursors, newMessages] = getNewMessages(oldCursors, current);

  if (isSingleMessage(params)) {
    return [
      client,
      [
        sendData(
          id,
          buildPlot(
            metadata,
            globalVariables,
            params,
            R.map((messages) => messages.slice(-1), current),
          ),
        ),
      ],
    ];
  }

  if (R.isEmpty(newMessages)) {
    return noEffects(client);
  }

  const newData = buildPlot(metadata, globalVariables, params, newMessages);

  return [
    {
      ...client,
      current: {
        cursors: newCursors,
        data: appendPlotData(oldData, newData),
      },
    },
    [sendPartial(id, newData)],
  ];
});

export function addCurrent(events: readonly MessageEvent[], state: State): StateAndEffects {
  const { current, isLive } = state;

  return R.pipe(
    R.reduce(
      (a: Messages, v: MessageEvent): Messages => ({ ...a, [v.topic]: [...(a[v.topic] ?? []), v] }),
      {},
    ),
    (messages) => ({ ...state, current: R.mergeWith(R.concat, messages, current) }),
    noEffects,
    appendEffects(isLive ? updateLiveClients : updateRecordedClients),
    keepEffects(evictCache),
  )(events);
}
