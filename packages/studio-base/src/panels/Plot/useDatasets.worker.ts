// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as Comlink from "comlink";
import * as R from "ramda";

import { Immutable } from "@foxglove/studio";
import { iterateTyped } from "@foxglove/studio-base/components/Chart/datasets";
import { downsample } from "@foxglove/studio-base/components/TimeBasedChart/downsample";
import {
  ProviderStateSetter,
  PlotViewport,
} from "@foxglove/studio-base/components/TimeBasedChart/types";
import { GlobalVariables } from "@foxglove/studio-base/hooks/useGlobalVariables";
import { Topic, MessageEvent } from "@foxglove/studio-base/players/types";
import { RosDatatypes } from "@foxglove/studio-base/types/RosDatatypes";
import strPack from "@foxglove/studio-base/util/strPack";

import { resolveTypedIndices } from "./datasets";
import { PlotParams, TypedData, Messages } from "./internalTypes";
import { isSingleMessage } from "./params";
import {
  reducePlotData,
  PlotData,
  StateHandler,
  mapDatasets,
  applyDerivativeToPlotData,
  sortPlotDataByHeaderStamp,
  getProvidedData,
} from "./plotData";
import {
  SideEffectType,
  State as ProcessorState,
  StateAndEffects,
  init as initProcessor,
  Client,
  findClient,
  register as registerPure,
  addBlock as addBlockPure,
  receiveMetadata as receiveMetadataPure,
  clearCurrent as clearCurrentPure,
  addCurrent as addCurrentPure,
  receiveVariables as receiveVariablesPure,
  updateParams as updateParamsPure,
  updateView as updateViewPure,
  unregister as unregisterPure,
  setLive as setLivePure,
} from "./processor";

type Setter = ProviderStateSetter<TypedData[]>;

type Callbacks = {
  setPanel: StateHandler | undefined;
  setProvided: Setter | undefined;
  addPartial: Setter | undefined;
  queueRebuild: () => void;
};

let state: ProcessorState = initProcessor();
let callbacks: Record<string, Callbacks> = {};

// Throttle rebuilds to only occur at most every 100ms. This is slightly
// different from the throttled/debounced functions we use elsewhere in our
// codebase in that calls during the cooldown period will schedule at most one
// more invocation rather than simply being ignored or queued.
function makeRebuilder(id: string): () => void {
  let queue = false;
  let cooldown: ReturnType<typeof setTimeout> | undefined;

  const doRebuild = () => {
    rebuild(id);
  };
  const schedule = () => {
    cooldown = setTimeout(() => {
      cooldown = undefined;
      if (queue) {
        queue = false;
        doRebuild();
        schedule();
      }
    }, 100);
  };

  return () => {
    if (cooldown == undefined) {
      doRebuild();
      schedule();
      return;
    }
    queue = true;
  };
}

function sendPlotData(clientCallbacks: Callbacks, data: PlotData) {
  clientCallbacks.setPanel?.(data);
  clientCallbacks.setProvided?.(getProvidedData(data));
}

function getClientData(client: Client): PlotData | undefined {
  const {
    params,
    view,
    blocks: { data: blockData },
    current: { data: currentData },
  } = client;

  if (params == undefined || view == undefined) {
    return undefined;
  }

  const { bounds: blockBounds } = blockData;
  const { bounds: currentBounds } = currentData;

  let datasets: PlotData[] = [];
  if (blockBounds.x.min <= currentBounds.x.min && blockBounds.x.max > currentBounds.x.max) {
    // ignore current data if block data covers it already
    datasets = [blockData];
  } else {
    // unbounded plots should also use current data
    datasets = [blockData, currentData];
  }

  return R.pipe(reducePlotData, applyDerivativeToPlotData, sortPlotDataByHeaderStamp)(datasets);
}

function rebuild(id: string) {
  const client = findClient(state, id);
  const clientCallbacks = callbacks[id];
  if (client == undefined || clientCallbacks == undefined) {
    return;
  }

  const newData = getClientData(client);
  if (newData == undefined) {
    return;
  }

  const { params, view } = client;
  if (params == undefined || view == undefined) {
    return;
  }

  // We do not downsample single-message plots (for now)
  if (isSingleMessage(params)) {
    return;
  }

  const downsampled = mapDatasets((dataset) => {
    const indices = downsample(dataset, iterateTyped(dataset.data), view);
    const resolved = resolveTypedIndices(dataset.data, indices);
    if (resolved == undefined) {
      return dataset;
    }

    return {
      ...dataset,
      data: resolved,
    };
  }, newData.datasets);

  sendPlotData(clientCallbacks, {
    ...newData,
    datasets: downsampled,
  });
}

function handleEffects([newState, effects]: StateAndEffects): void {
  state = newState;

  for (const effect of effects) {
    switch (effect.type) {
      case SideEffectType.Rebuild: {
        const clientCallbacks = callbacks[effect.clientId];
        if (clientCallbacks == undefined) {
          continue;
        }
        clientCallbacks.queueRebuild();
        break;
      }
      case SideEffectType.Data: {
        const clientCallbacks = callbacks[effect.clientId];
        if (clientCallbacks == undefined) {
          continue;
        }
        sendPlotData(clientCallbacks, effect.data);
        break;
      }
      case SideEffectType.Partial: {
        const clientCallbacks = callbacks[effect.clientId];
        if (clientCallbacks == undefined) {
          continue;
        }
        clientCallbacks.addPartial?.(getProvidedData(effect.data));
        break;
      }
    }
  }
}

// eslint-disable-next-line @foxglove/no-boolean-parameters
function setLive(value: boolean): void {
  state = setLivePure(value, state);
}

function unregister(id: string): void {
  const { [id]: _, ...newCallbacks } = callbacks;
  callbacks = newCallbacks;
  state = unregisterPure(id, state);
}

function receiveMetadata(topics: readonly Topic[], datatypes: Immutable<RosDatatypes>): void {
  state = receiveMetadataPure(topics, strPack(datatypes), state);
}

function receiveVariables(variables: GlobalVariables): void {
  handleEffects(receiveVariablesPure(variables, state));
}

function addBlock(block: Messages, resetTopics: string[]): void {
  handleEffects(addBlockPure(strPack(block), resetTopics, state));
}

function clearCurrent(): void {
  handleEffects(clearCurrentPure(state));
}

function addCurrent(events: readonly MessageEvent[]): void {
  handleEffects(addCurrentPure(events, state));
}

function updateParams(id: string, params: PlotParams): void {
  handleEffects(updateParamsPure(id, params, state));
}

function updateView(id: string, view: PlotViewport): void {
  handleEffects(updateViewPure(id, view, state));
}

//const MESSAGE_CULL_THRESHOLD = 15_000;

//function compressClients(): void {
//if (!isLive) {
//return;
//}

//current = R.map(
//(messages) =>
//messages.length > MESSAGE_CULL_THRESHOLD
//? messages.slice(messages.length - MESSAGE_CULL_THRESHOLD)
//: messages,
//current,
//);

//for (const client of R.values(clients)) {
//const { params } = client;
//if (params == undefined) {
//continue;
//}

//const accumulated = accumulate(initAccumulated(client.topics), params, current);
//mutateClient(client.id, {
//...client,
//current: accumulated,
//});
//client.setProvided?.(getProvidedData(accumulated.data));
//}
//}
//setInterval(compressClients, 2000);

function register(
  id: string,
  setProvided: Setter,
  setPanel: StateHandler,
  addPartial: Setter,
  params: PlotParams | undefined,
): void {
  callbacks[id] = {
    setProvided,
    addPartial,
    setPanel,
    queueRebuild: makeRebuilder(id),
  };

  handleEffects(registerPure(id, params, state));
}

function getFullData(id: string): PlotData | undefined {
  const client = findClient(state, id);
  if (client == undefined) {
    return;
  }

  return getClientData(client);
}

export const service = {
  addBlock,
  addCurrent,
  clearCurrent,
  getFullData,
  receiveMetadata,
  receiveVariables,
  register,
  setLive,
  unregister,
  updateParams,
  updateView,
};
Comlink.expose(service);
