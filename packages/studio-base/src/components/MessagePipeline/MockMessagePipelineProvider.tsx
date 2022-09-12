// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
//
// This file incorporates work covered by the following copyright and
// permission notice:
//
//   Copyright 2018-2021 Cruise LLC
//
//   This source code is licensed under the Apache License, Version 2.0,
//   found at http://www.apache.org/licenses/LICENSE-2.0
//   You may not use this file except in compliance with the License.

import { omit } from "lodash";
import { useEffect, useRef, useState } from "react";
import shallowEqual from "shallowequal";
import { createStore } from "zustand";

import { Time, isLessThan } from "@foxglove/rostime";
import { ParameterValue } from "@foxglove/studio";
import {
  AdvertiseOptions,
  MessageEvent,
  PlayerPresence,
  PlayerStateActiveData,
  PlayerProblem,
  Progress,
  PublishPayload,
  SubscribePayload,
  Topic,
  PlayerURLState,
  TopicStats,
} from "@foxglove/studio-base/players/types";
import { RosDatatypes } from "@foxglove/studio-base/types/RosDatatypes";

import { ContextInternal } from "./index";
import { MessagePipelineInternalState, MessagePipelineStateAction, reducer } from "./store";

const NO_DATATYPES = new Map();

function noop() {}

type MockMessagePipelineProps = {
  presence?: PlayerPresence;
  topics?: Topic[];
  topicStats?: Map<string, TopicStats>;
  datatypes?: RosDatatypes;
  messages?: MessageEvent<unknown>[];
  problems?: PlayerProblem[];
  publish?: (request: PublishPayload) => void;
  callService?: (service: string, request: unknown) => Promise<unknown>;
  setPublishers?: (arg0: string, arg1: AdvertiseOptions[]) => void;
  setSubscriptions?: (arg0: string, arg1: SubscribePayload[]) => void;
  setParameter?: (key: string, value: ParameterValue) => void;
  noActiveData?: boolean;
  activeData?: Partial<PlayerStateActiveData>;
  capabilities?: string[];
  profile?: string;
  startPlayback?: () => void;
  pausePlayback?: () => void;
  seekPlayback?: (arg0: Time) => void;
  currentTime?: Time;
  startTime?: Time;
  endTime?: Time;
  isPlaying?: boolean;
  pauseFrame?: (arg0: string) => () => void;
  playerId?: string;
  progress?: Progress;
  urlState?: PlayerURLState;
  /* eslint-enable react/no-unused-prop-types */
};
type MockMessagePipelineState = MessagePipelineInternalState & {
  mockProps: MockMessagePipelineProps;
  sentFirstMessages: boolean;
  dispatch: (
    action:
      | MessagePipelineStateAction
      | { type: "set-mock-props"; mockProps: MockMessagePipelineProps },
  ) => void;
};

function getPublicState(
  prevState: MockMessagePipelineState | undefined,
  props: MockMessagePipelineProps,
  dispatch: MockMessagePipelineState["dispatch"],
): Omit<MessagePipelineInternalState["public"], "messageEventsBySubscriberId"> {
  let startTime = prevState?.public.playerState.activeData?.startTime;
  let currentTime = props.currentTime;
  if (!currentTime) {
    for (const message of props.messages ?? []) {
      if (startTime == undefined || isLessThan(message.receiveTime, startTime)) {
        startTime = message.receiveTime;
      }
      if (!currentTime || isLessThan(currentTime, message.receiveTime)) {
        currentTime = message.receiveTime;
      }
    }
  }

  return {
    playerState: {
      presence: props.presence ?? PlayerPresence.PRESENT,
      playerId: props.playerId ?? "1",
      progress: props.progress ?? {},
      capabilities: props.capabilities ?? [],
      profile: props.profile,
      problems: props.problems,
      urlState: props.urlState,
      activeData:
        props.noActiveData === true
          ? undefined
          : {
              messages: props.messages ?? [],
              topics: props.topics ?? [],
              topicStats: props.topicStats ?? new Map(),
              datatypes: props.datatypes ?? NO_DATATYPES,
              startTime: props.startTime ?? startTime ?? { sec: 100, nsec: 0 },
              currentTime: currentTime ?? { sec: 100, nsec: 0 },
              endTime: props.endTime ?? currentTime ?? { sec: 100, nsec: 0 },
              isPlaying: props.isPlaying ?? false,
              speed: 0.2,
              lastSeekTime: 0,
              totalBytesReceived: 0,
              ...props.activeData,
            },
    },
    subscriptions: [],
    publishers: [],
    sortedTopics:
      props.topics === prevState?.mockProps.topics
        ? prevState?.public.sortedTopics ?? []
        : props.topics
        ? [...props.topics].sort((a, b) => a.name.localeCompare(b.name))
        : [],
    datatypes: props.datatypes ?? NO_DATATYPES,
    setSubscriptions(id, payloads) {
      console.log("dispatching update-subscriber from", new Error().stack);
      dispatch({ type: "update-subscriber", id, payloads });
      props.setSubscriptions?.(id, payloads);
    },
    setPublishers(id, payloads) {
      dispatch({ type: "set-publishers", id, payloads });
      props.setPublishers?.(id, payloads);
    },
    setParameter: props.setParameter ?? noop,
    publish: props.publish ?? noop,
    callService: props.callService ?? (async () => {}),
    startPlayback: props.startPlayback,
    playUntil: noop,
    pausePlayback: props.pausePlayback,
    setPlaybackSpeed: noop,
    seekPlayback: props.seekPlayback,

    pauseFrame: props.pauseFrame ?? (() => noop),
  };
}

export default function MockMessagePipelineProvider(
  props: React.PropsWithChildren<MockMessagePipelineProps>,
): React.ReactElement {
  const startTime = useRef<Time | undefined>();
  let currentTime = props.currentTime;
  if (!currentTime) {
    for (const message of props.messages ?? []) {
      if (startTime.current == undefined || isLessThan(message.receiveTime, startTime.current)) {
        startTime.current = message.receiveTime;
      }
      if (!currentTime || isLessThan(currentTime, message.receiveTime)) {
        currentTime = message.receiveTime;
      }
    }
  }

  // See comment for messageEventsBySubscriberId below on the purpose of this ref
  // const firstChangeRef = useRef<boolean>(false);

  const [store] = useState(() =>
    createStore<MockMessagePipelineState>((set) => {
      const dispatch: MockMessagePipelineState["dispatch"] = (action) => {
        console.log("dispatch", action);
        if (action.type === "set-mock-props") {
          set((state) => {
            if (shallowEqual(state.mockProps, action.mockProps)) {
              console.log("mock props didn't change");
              return state;
            }
            const publicState = getPublicState(state, action.mockProps, state.dispatch);
            const newState = reducer(state, {
              type: "update-player-state",
              playerState: publicState.playerState,
            });
            console.log("new mock props =>", {
              newTopicsBySubscriberId: newState.newTopicsBySubscriberId,
              messageEventsBySubscriberId: JSON.stringify([
                ...newState.public.messageEventsBySubscriberId.entries(),
              ]),
              messages: newState.public.playerState.activeData?.messages.map((m) => m.message),
            });
            return {
              ...newState,
              mockProps: action.mockProps,
              dispatch: state.dispatch,
              public: {
                ...publicState,
                messageEventsBySubscriberId: newState.public.messageEventsBySubscriberId,
              },
            };
          });
        } else {
          set((state) => {
            const newState = reducer(state, action);
            if (
              action.type === "update-subscriber" &&
              newState.public.messageEventsBySubscriberId.size === 0 &&
              !state.sentFirstMessages
            ) {
              newState.public.messageEventsBySubscriberId.set(action.id, []);
              const messageEventsBySubscriberId = new Map(
                Array.from(
                  newState.subscriptionsById.entries(),
                  ([id, payloads]: [string, SubscribePayload[]]) => [
                    id,
                    newState.public.playerState.activeData?.messages.filter((msg) =>
                      payloads.find((payload) => payload.topic === msg.topic),
                    ) ?? [],
                  ],
                ),
              );
              console.log(
                "hack",
                newState.subscriptionsById,
                newState.public.playerState.activeData,
                "=>",
                messageEventsBySubscriberId,
              );
              newState.public.messageEventsBySubscriberId = messageEventsBySubscriberId;
            }
            const res = { ...newState, dispatch: state.dispatch, sentFirstMessages: true };
            console.log("completed update", action, res);
          });
        }
      };
      return {
        mockProps: omit(props, "children"),
        sentFirstMessages: false,
        player: undefined,
        dispatch,
        publishersById: {},
        subscriptionsById: new Map(),
        subscriberIdsByTopic: new Map(),
        newTopicsBySubscriberId: new Map(),
        lastMessageEventByTopic: new Map(),
        lastCapabilities: [],
        public: {
          ...getPublicState(undefined, props, dispatch),
          messageEventsBySubscriberId: new Map(),
        },
      };
    }),
  );

  useEffect(() => {
    store.getState().dispatch({ type: "set-mock-props", mockProps: omit(props, "children") });
  }, [props, store]);

  // const [allSubscriptions, setAllSubscriptions] = useState<{
  //   [key: string]: SubscribePayload[];
  // }>({});
  // const flattenedSubscriptions: SubscribePayload[] = useMemo(
  //   () => flatten(Object.values(allSubscriptions)),
  //   [allSubscriptions],
  // );
  // const setSubscriptions = useCallback(
  //   (id: string, subs: SubscribePayload[]) => {
  //     setAllSubscriptions((sub) => ({ ...sub, [id]: subs }));
  //     const setSubs = props.setSubscriptions;
  //     setSubs?.(id, subs);
  //     if (subs.length > 0) {
  //       firstChangeRef.current = true;
  //     }
  //   },
  //   [setAllSubscriptions, props.setSubscriptions],
  // );

  // const capabilities = useShallowMemo(props.capabilities ?? []);

  // // In the real pipeline, the messageEventsBySubscriberId only change
  // // on player listener callback - not on subscriber changes
  // //
  // // In tests, the first setSubscriptions call happens after we've already set props.messages
  // // So we have some special logic to detect the _first_ change of subscriptions
  // // and update messageEventsBySubscriberId.
  // const latestAllSubs = useLatest(allSubscriptions);
  // const firstChange = firstChangeRef.current;
  // const messageEventsBySubscriberId = useMemo(() => {
  //   void firstChange;
  //   return new Map(
  //     Object.entries(latestAllSubs.current).map(([id, payloads]) => [
  //       id,
  //       props.messages?.filter((msg) => payloads.find((payload) => payload.topic === msg.topic)) ??
  //         [],
  //     ]),
  //   );
  // }, [firstChange, props.messages, latestAllSubs]);

  // {
  //   playerState,
  //   sortedTopics: (props.topics ?? []).sort(naturalSort("name")),
  //   datatypes: props.datatypes ?? NO_DATATYPES,
  //   subscriptions: flattenedSubscriptions,
  //   publishers: [],
  //   messageEventsBySubscriberId,
  //   setSubscriptions,
  //   setPublishers: props.setPublishers ?? noop,
  //   setParameter: props.setParameter ?? noop,
  //   publish: props.publish ?? noop,
  //   callService: props.callService ?? (async () => await Promise.reject()),
  //   startPlayback: props.startPlayback ?? noop,
  //   pausePlayback: props.pausePlayback ?? noop,
  //   setPlaybackSpeed: noop,
  //   seekPlayback: props.seekPlayback ?? noop,
  //   pauseFrame: props.pauseFrame ?? (() => noop),
  // }
  console.log("in MockMessagePipelineProvider render");
  return <ContextInternal.Provider value={store}>{props.children}</ContextInternal.Provider>;
}
