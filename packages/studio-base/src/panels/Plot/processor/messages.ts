// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as R from "ramda";

import parseRosPath from "@foxglove/studio-base/components/MessagePathSyntax/parseRosPath";

import { fillInGlobalVariablesInPath } from "@foxglove/studio-base/components/MessagePathSyntax/useCachedGetMessagePathDataItems";
import { GlobalVariables } from "@foxglove/studio-base/hooks/useGlobalVariables";
import { PlotParams, Messages, MetadataEnums, PlotDataItem, BasePlotPath } from "../internalTypes";
import { PlotData, appendPlotData, buildPlotData, resolvePath } from "../plotData";
import {
  Cursors,
  State,
  Accumulated,
  initAccumulated,
  StateAndEffects,
  Client,
  SideEffects,
  rebuildClient,
} from "./state";
import { isSingleMessage } from "../params";

function getPathData(
  metadata: MetadataEnums,
  globalVariables: GlobalVariables,
  messages: Messages,
  path: BasePlotPath,
): PlotDataItem[] | undefined {
  const parsed = parseRosPath(path.value);
  if (parsed == undefined) {
    return [];
  }

  return resolvePath(
    metadata,
    messages[parsed.topicName] ?? [],
    fillInGlobalVariablesInPath(parsed, globalVariables),
  );
}

function buildPlot(
  metadata: MetadataEnums,
  globalVariables: GlobalVariables,
  params: PlotParams,
  messages: Messages,
): PlotData {
  const { paths, invertedTheme, startTime, xAxisPath, xAxisVal } = params;
  return buildPlotData({
    invertedTheme,
    paths: paths.map((path) => [path, getPathData(metadata, globalVariables, messages, path)]),
    startTime,
    xAxisPath,
    xAxisData:
      xAxisPath != undefined
        ? getPathData(metadata, globalVariables, messages, xAxisPath)
        : undefined,
    xAxisVal,
  });
}

function getNewMessages(
  cursors: Cursors,
  messages: Messages,
): [newCursors: Cursors, newMessages: Messages] {
  const newCursors: Cursors = {};
  const newMessages: Messages = {};

  for (const [topic, cursor] of Object.entries(cursors)) {
    newCursors[topic] = messages[topic]?.length ?? cursor;
    newMessages[topic] = messages[topic]?.slice(cursor) ?? [];
  }

  return [newCursors, newMessages];
}

export function accumulate(
  metadata: MetadataEnums,
  globalVariables: GlobalVariables,
  previous: Accumulated,
  params: PlotParams,
  messages: Messages,
): Accumulated {
  const { cursors: oldCursors, data: oldData } = previous;
  const [newCursors, newMessages] = getNewMessages(oldCursors, messages);

  if (R.isEmpty(newMessages)) {
    return previous;
  }

  return {
    cursors: newCursors,
    data: appendPlotData(oldData, buildPlot(metadata, globalVariables, params, newMessages)),
  };
}

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
