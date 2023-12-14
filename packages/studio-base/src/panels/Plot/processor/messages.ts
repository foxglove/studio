// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as R from "ramda";

import { Immutable } from "@foxglove/studio";
import { messagePathStructures } from "@foxglove/studio-base/components/MessagePathSyntax/messagePathsForDatatype";
import { Topic, MessageEvent } from "@foxglove/studio-base/players/types";
import { RosDatatypes } from "@foxglove/studio-base/types/RosDatatypes";
import { enumValuesByDatatypeAndField } from "@foxglove/studio-base/util/enums";

import { initAccumulated, accumulate, buildPlot } from "./accumulate";
import {
  rebuildClient,
  sendData,
  mapClients,
  noEffects,
  concatEffects,
  mutateClient,
} from "./state";
import { State, StateAndEffects, Client, SideEffects } from "./types";
import { BlockUpdate, ClientUpdate } from "../blocks";
import { Messages } from "../internalTypes";
import { isSingleMessage } from "../params";

export function receiveMetadata(
  topics: readonly Topic[],
  datatypes: Immutable<RosDatatypes>,
  state: State,
): State {
  return {
    ...state,
    metadata: {
      topics,
      datatypes,
      enumValues: enumValuesByDatatypeAndField(datatypes),
      structures: messagePathStructures(datatypes),
    },
  };
}

export function applyBlockUpdate(update: BlockUpdate, state: State): StateAndEffects {
  const { metadata, globalVariables } = state;
  const { messages, updates } = update;

  return R.reduce(
    (stateAndEffects: StateAndEffects, clientUpdate: ClientUpdate): StateAndEffects => {
      return concatEffects((state: State): StateAndEffects => {
        const client = state.clients.find(({ id }) => id === clientUpdate.id);
        if (client == undefined) {
          return noEffects(state);
        }

        const { params } = client;
        if (params == undefined || isSingleMessage(params)) {
          return noEffects(state);
        }

        const {
          update: { range, topic, shouldReset },
        } = clientUpdate;

        const [start, end] = range;
        const topicMessages = messages[topic];
        if (topicMessages == undefined) {
          return noEffects(state);
        }

        const newBlockData = accumulate(
          metadata,
          globalVariables,
          shouldReset ? initAccumulated() : client.blocks,
          params,
          {
            [topic]: topicMessages.slice(start, end).flatMap((v) => v),
          },
        );

        return [
          mutateClient(state, client.id, {
            ...client,
            blocks: newBlockData,
          }),
          [rebuildClient(client.id)],
        ];
      })(stateAndEffects);
    },
    noEffects(state),
    updates,
  );
}

export function addBlock(update: BlockUpdate, state: State): StateAndEffects {
  const { pending } = state;
  const { updates, messages } = update;

  // If we get updates for clients that haven't registered yet, we've got to
  // keep that data around and use it when they register
  const clientIds = state.clients.map(({ id }) => id);
  const unused = updates.filter(({ id }) => !clientIds.includes(id));

  const newState = {
    ...state,
    pending: [...pending, ...(unused.length > 0 ? [{ messages, updates: unused }] : [])],
  };

  return applyBlockUpdate(update, newState);
}

export function addCurrent(events: readonly MessageEvent[], state: State): StateAndEffects {
  const current: Messages = R.groupBy((v: MessageEvent) => v.topic, events) as Messages;

  return R.pipe(
    mapClients((client): [Client, SideEffects] => {
      const { metadata, globalVariables } = state;
      const { id, params } = client;
      if (params == undefined) {
        return noEffects(client);
      }

      if (isSingleMessage(params)) {
        const plotData = buildPlot(
          metadata,
          globalVariables,
          params,
          R.map((messages) => (messages ?? []).slice(-1), current),
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
    }),
  )(state);
}

export function clearCurrent(state: State): StateAndEffects {
  const newState = {
    ...state,
    current: {},
  };

  return mapClients((client) => {
    return [
      {
        ...client,
        current: initAccumulated(),
      },
      [rebuildClient(client.id)],
    ];
  })(newState);
}
