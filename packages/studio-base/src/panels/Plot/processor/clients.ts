// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as R from "ramda";

import { getParamTopics } from "../params";
import {
  StateAndEffects,
  State,
  findClient,
  noEffects,
  mutateClient,
  rebuildClient,
  keepEffects,
  Client,
} from "./state";
import { evictCache } from "./messages";
import { initAccumulated, accumulate } from "./accumulate";
import { PlotParams } from "../internalTypes";
import { PlotViewport } from "@foxglove/studio-base/components/TimeBasedChart/types";

export function refreshClient(state: State, id: string): StateAndEffects {
  const { blocks, current, metadata, globalVariables } = state;
  const client = findClient(state, id);
  if (client == undefined) {
    return noEffects(state);
  }

  const { params } = client;
  if (params == undefined) {
    return noEffects(state);
  }

  const topics = getParamTopics(params);
  const initialState = initAccumulated(topics);
  return [
    mutateClient(state, id, {
      ...client,
      topics,
      blocks: accumulate(metadata, globalVariables, initialState, params, blocks),
      current: accumulate(metadata, globalVariables, initialState, params, current),
    }),
    [rebuildClient(id)],
  ];
}

export function updateParams(state: State, id: string, params: PlotParams): StateAndEffects {
  const client = findClient(state, id);
  if (client == undefined) {
    return noEffects(state);
  }

  return R.pipe(
    (state) =>
      mutateClient(state, id, {
        ...client,
        params,
        topics: getParamTopics(params),
      }),
    (state) => refreshClient(state, id),
    keepEffects(evictCache),
  )(state);
}

export function updateView(state: State, id: string, view: PlotViewport): StateAndEffects {
  const client = findClient(state, id);
  if (client == undefined) {
    return noEffects(state);
  }
  return [mutateClient(state, id, { ...client, view }), [rebuildClient(id)]];
}

export function register(
  state: State,
  id: string,
  params: PlotParams | undefined,
): StateAndEffects {
  const { clients } = state;
  const newState = {
    ...state,
    clients: [
      ...clients,
      {
        id,
        params,
        topics: [],
        view: undefined,
        blocks: initAccumulated([]),
        current: initAccumulated([]),
      },
    ],
  };

  if (params == undefined) {
    return [newState, []];
  }

  return updateParams(newState, id, params);
}

export function unregister(id: string, state: State): State {
  return evictCache({
    ...state,
    clients: R.filter(({ id: clientId }: Client) => clientId !== id, state.clients),
  });
}
