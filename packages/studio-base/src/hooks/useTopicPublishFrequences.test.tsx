/** @jest-environment jsdom */
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { renderHook } from "@testing-library/react";
import { DeepPartial } from "ts-essentials";

import {
  MessagePipelineContext,
  useMessagePipeline,
} from "@foxglove/studio-base/components/MessagePipeline";
import { useTopicPublishFrequencies } from "@foxglove/studio-base/hooks/useTopicPublishFrequences";
import { PlayerCapabilities, PlayerState } from "@foxglove/studio-base/players/types";

jest.mock("@foxglove/studio-base/components/MessagePipeline");

describe("useSynchronousMountedState", () => {
  it("calculates frequences for a static source", () => {
    (useMessagePipeline as jest.Mock).mockImplementation(
      (selector: (ctx: DeepPartial<MessagePipelineContext>) => unknown) =>
        selector({
          playerState: {
            activeData: {
              currentTime: { sec: 2, nsec: 0 },
              endTime: { sec: 10, nsec: 0 },
              startTime: { sec: 0, nsec: 0 },
              topicStats: new Map([
                [
                  "topic_a",
                  {
                    numMessages: 10,
                    firstMessageTime: { sec: 1, nsec: 0 },
                    lastMessageTime: { sec: 5, nsec: 0 },
                  },
                ],
                [
                  "topic_b",
                  {
                    numMessages: 20,
                    firstMessageTime: { sec: 2, nsec: 0 },
                    lastMessageTime: { sec: 7, nsec: 0 },
                  },
                ],
              ]),
            },
            capabilities: [PlayerCapabilities.playbackControl],
          },
        }),
    );

    const { result } = renderHook(useTopicPublishFrequencies);

    expect(result.current).toStrictEqual({ topic_a: 2.25, topic_b: 3.8 });
  });

  it("updates frequences for a live source", () => {
    const activeData: DeepPartial<PlayerState["activeData"]> = {
      currentTime: { sec: 2, nsec: 0 },
      endTime: { sec: 10, nsec: 0 },
      startTime: { sec: 0, nsec: 0 },
      topicStats: new Map([
        ["topic_a", { numMessages: 10 }],
        ["topic_b", { numMessages: 20 }],
      ]),
    };

    (useMessagePipeline as jest.Mock).mockImplementation(
      (selector: (ctx: DeepPartial<MessagePipelineContext>) => unknown) =>
        selector({
          playerState: {
            activeData,
            capabilities: [],
          },
        }),
    );

    const { result, rerender } = renderHook(useTopicPublishFrequencies);

    expect(result.current).toStrictEqual({});

    activeData.currentTime = { sec: 3, nsec: 0 };
    activeData.topicStats = new Map([
      ["topic_a", { numMessages: 20 }],
      ["topic_b", { numMessages: 40 }],
    ]);
    rerender();

    expect(result.current).toStrictEqual({ topic_a: 10, topic_b: 20 });
  });
});
