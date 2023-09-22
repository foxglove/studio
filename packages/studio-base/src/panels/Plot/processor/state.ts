// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as R from "ramda";

import { GlobalVariables } from "@foxglove/studio-base/hooks/useGlobalVariables";
import { PlotViewport } from "@foxglove/studio-base/components/TimeBasedChart/types";
import { PlotParams, Messages, MetadataEnums } from "../internalTypes";
import { Accumulated } from "./accumulate";

export type Client = {
  id: string;
  params: PlotParams | undefined;
  topics: readonly string[];
  view: PlotViewport | undefined;
  blocks: Accumulated;
  current: Accumulated;
};

export type State = {
  isLive: boolean;
  clients: Client[];
  globalVariables: GlobalVariables;
  blocks: Messages;
  current: Messages;
  metadata: MetadataEnums;
};

enum SideEffectType {
  Rebuild = "rebuild",
}

type RebuildEffect = {
  type: SideEffectType.Rebuild;
  clientId: string;
};

export const rebuildClient = (id: string): RebuildEffect => ({
  type: SideEffectType.Rebuild,
  clientId: id,
});

type SideEffect = RebuildEffect;

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

export function noEffects(state: State): StateAndEffects {
  return [state, []];
}

export const findClient = (state: State, id: string) =>
  R.find((client) => client.id === id, state.clients);

export const mutateClient = (state: State, id: string, newClient: Client): State => ({
  ...state,
  clients: state.clients.map((client) => (client.id === id ? newClient : client)),
});

export const keepEffects =
  (mutator: (state: State) => State) =>
  ([state, effects]: StateAndEffects): StateAndEffects => {
    return [mutator(state), effects];
  };
