// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  MappingInputs,
  mapPlayerState,
} from "@foxglove/studio-base/players/TopicMappingPlayer/mapping";
import {
  PlayerPresence,
  PlayerState,
  PlayerStateActiveData,
  Topic,
} from "@foxglove/studio-base/players/types";

function fakePlayerState(
  overrides?: Partial<PlayerState>,
  dataOverrides?: Partial<PlayerStateActiveData>,
): PlayerState {
  return {
    activeData: {
      messages: [],
      currentTime: { sec: 0, nsec: 0 },
      endTime: { sec: 0, nsec: 0 },
      lastSeekTime: 1,
      topics: [],
      speed: 1,
      isPlaying: false,
      topicStats: new Map(),
      startTime: { sec: 0, nsec: 0 },
      datatypes: new Map(),
      totalBytesReceived: 0,
      ...dataOverrides,
    },
    capabilities: [],
    presence: PlayerPresence.PRESENT,
    profile: undefined,
    playerId: "1",
    progress: {
      fullyLoadedFractionRanges: [],
      messageCache: undefined,
    },
    ...overrides,
  };
}

describe("mapPlayerState", () => {
  it("maps blocks", () => {
    const topics: Topic[] = [
      { name: "/topic_1", schemaName: "whatever" },
      { name: "/topic_2", schemaName: "whatever" },
    ];
    const state = fakePlayerState(
      {
        progress: {
          fullyLoadedFractionRanges: [],
          messageCache: {
            startTime: { sec: 0, nsec: 1 },
            blocks: [
              {
                messagesByTopic: {
                  "/topic_1": [
                    {
                      topic: "/topic_1",
                      receiveTime: { sec: 0, nsec: 0 },
                      message: undefined,
                      schemaName: "whatever",
                      sizeInBytes: 0,
                    },
                  ],
                  "/topic_2": [
                    {
                      topic: "/topic_2",
                      receiveTime: { sec: 0, nsec: 0 },
                      message: undefined,
                      schemaName: "whatever",
                      sizeInBytes: 0,
                    },
                  ],
                },
                sizeInBytes: 0,
              },
            ],
          },
        },
      },
      {
        topics,
      },
    );
    const inputs: MappingInputs = {
      mappers: [() => new Map([["/topic_1", "/renamed_topic_1"]])],
      topics,
    };
    const mapped = mapPlayerState(inputs, state);
    expect(mapped.progress).toEqual({
      fullyLoadedFractionRanges: [],
      messageCache: {
        startTime: { sec: 0, nsec: 1 },
        blocks: [
          {
            messagesByTopic: {
              "/renamed_topic_1": [
                {
                  topic: "/renamed_topic_1",
                  receiveTime: { sec: 0, nsec: 0 },
                  message: undefined,
                  schemaName: "whatever",
                  sizeInBytes: 0,
                },
              ],
              "/topic_2": [
                {
                  topic: "/topic_2",
                  receiveTime: { sec: 0, nsec: 0 },
                  message: undefined,
                  schemaName: "whatever",
                  sizeInBytes: 0,
                },
              ],
            },
            sizeInBytes: 0,
          },
        ],
      },
    });
  });

  it("maps messages", () => {
    const topics: Topic[] = [
      { name: "/topic_1", schemaName: "whatever" },
      { name: "/topic_2", schemaName: "whatever" },
    ];
    const state = fakePlayerState(undefined, {
      topics,
      messages: [
        {
          topic: "/topic_1",
          receiveTime: { sec: 0, nsec: 0 },
          message: undefined,
          schemaName: "whatever",
          sizeInBytes: 0,
        },
        {
          topic: "/topic_2",
          receiveTime: { sec: 0, nsec: 0 },
          message: undefined,
          schemaName: "whatever",
          sizeInBytes: 0,
        },
      ],
    });
    const inputs: MappingInputs = {
      mappers: [() => new Map([["/topic_1", "/renamed_topic_1"]])],
      topics,
    };
    const mapped = mapPlayerState(inputs, state);
    expect(mapped.activeData?.messages).toEqual([
      expect.objectContaining({ topic: "/renamed_topic_1" }),
      expect.objectContaining({ topic: "/topic_2" }),
    ]);
  });

  it("maps published topics", () => {
    const topics: Topic[] = [
      { name: "/topic_1", schemaName: "whatever" },
      { name: "/topic_2", schemaName: "whatever" },
    ];
    const state = fakePlayerState(undefined, {
      topics,
      publishedTopics: new Map([
        ["1", new Set(["/topic_1", "/topic_2"])],
        ["2", new Set(["/topic_2"])],
      ]),
    });
    const inputs: MappingInputs = {
      mappers: [() => new Map([["/topic_1", "/renamed_topic_1"]])],
      topics,
    };
    const mapped = mapPlayerState(inputs, state);
    expect(mapped.activeData?.publishedTopics).toEqual(
      new Map([
        ["1", new Set(["/renamed_topic_1", "/topic_2"])],
        ["2", new Set(["/topic_2"])],
      ]),
    );
  });

  it("maps subscribed topics", () => {
    const topics: Topic[] = [
      { name: "/topic_1", schemaName: "whatever" },
      { name: "/topic_2", schemaName: "whatever" },
    ];
    const state = fakePlayerState(undefined, {
      topics,
      subscribedTopics: new Map([
        ["1", new Set(["/topic_1", "/topic_2"])],
        ["2", new Set(["/topic_2"])],
      ]),
    });
    const inputs: MappingInputs = {
      mappers: [() => new Map([["/topic_1", "/renamed_topic_1"]])],
      topics,
    };
    const mapped = mapPlayerState(inputs, state);
    expect(mapped.activeData?.subscribedTopics).toEqual(
      new Map([
        ["1", new Set(["/renamed_topic_1", "/topic_2"])],
        ["2", new Set(["/topic_2"])],
      ]),
    );
  });

  it("maps topics", () => {
    const topics: Topic[] = [
      { name: "/topic_1", schemaName: "whatever" },
      { name: "/topic_2", schemaName: "whatever" },
    ];
    const state = fakePlayerState(undefined, { topics });
    const inputs: MappingInputs = {
      mappers: [() => new Map([["/topic_1", "/renamed_topic_1"]])],
      topics,
    };
    const mapped = mapPlayerState(inputs, state);
    expect(mapped.activeData?.topics).toEqual([
      { name: "/renamed_topic_1", schemaName: "whatever", mappedFromName: "/topic_1" },
      { name: "/topic_2", schemaName: "whatever" },
    ]);
  });
});
