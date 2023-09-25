// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as R from "ramda";

import { PlotViewport } from "@foxglove/studio-base/components/TimeBasedChart/types";
import { GlobalVariables } from "@foxglove/studio-base/hooks/useGlobalVariables";

import { Accumulated, initAccumulated } from "./accumulate";
import { PlotParams, Messages, MetadataEnums } from "../internalTypes";
import { PlotData } from "../plotData";

export type Client = {
  id: string;
  params: PlotParams | undefined;
  topics: readonly string[];
  view: PlotViewport | undefined;
  blocks: Accumulated;
  current: Accumulated;
};

export function initClient(id: string, params: PlotParams | undefined): Client {
  return {
    id,
    params,
    topics: [],
    view: undefined,
    blocks: initAccumulated([]),
    current: initAccumulated([]),
  };
}

export type State = {
  isLive: boolean;
  clients: Client[];
  globalVariables: GlobalVariables;
  blocks: Messages;
  current: Messages;
  metadata: MetadataEnums;
};

export enum SideEffectType {
  Rebuild = "rebuild",
  Data = "data",
  Partial = "partial",
}

type RebuildEffect = {
  type: SideEffectType.Rebuild;
  clientId: string;
};

export const rebuildClient = (id: string): RebuildEffect => ({
  type: SideEffectType.Rebuild,
  clientId: id,
});

type DataEffect = {
  type: SideEffectType.Data;
  clientId: string;
  data: PlotData;
};

export const sendData = (id: string, data: PlotData): DataEffect => ({
  type: SideEffectType.Data,
  clientId: id,
  data,
});

type PartialEffect = {
  type: SideEffectType.Partial;
  clientId: string;
  data: PlotData;
};

export const sendPartial = (id: string, data: PlotData): PartialEffect => ({
  type: SideEffectType.Partial,
  clientId: id,
  data,
});

type SideEffect = RebuildEffect | DataEffect | PartialEffect;

export type SideEffects = SideEffect[];

export type StateAndEffects = [State, SideEffects];

export function init(): State {
  return {
    isLive: false,
    clients: [],
    globalVariables: {},
    blocks: {},
    current: {},
    metadata: {
      topics: [],
      datatypes: new Map(),
      enumValues: {},
      structures: {},
    },
  };
}

export function noEffects<T>(state: T): [T, SideEffects] {
  return [state, []];
}

// eslint-disable-next-line @foxglove/no-boolean-parameters
export const setLive = (isLive: boolean, state: State): State => ({ ...state, isLive });

export const appendEffects =
  (mutator: (state: State) => StateAndEffects) =>
  ([state, effects]: StateAndEffects): StateAndEffects => {
    const [newState, newEffects] = mutator(state);
    return [newState, [...effects, ...newEffects]];
  };

export const keepEffects =
  (mutator: (state: State) => State) =>
  ([state, effects]: StateAndEffects): StateAndEffects => {
    return [mutator(state), effects];
  };

export const findClient = (state: State, id: string): Client | undefined =>
  R.find((client) => client.id === id, state.clients);

export const mutateClient = (state: State, id: string, newClient: Client): State => ({
  ...state,
  clients: state.clients.map((client) => (client.id === id ? newClient : client)),
});

export const mapClients =
  (mutator: (client: Client, state: State) => [Client, SideEffects]) =>
  (state: State): StateAndEffects => {
    const { clients } = state;
    const changes = clients.map((client): [Client, SideEffects] => mutator(client, state));
    return [
      {
        ...state,
        clients: changes.map(([v]) => v),
      },
      R.chain(([, v]) => v, changes),
    ];
  };
