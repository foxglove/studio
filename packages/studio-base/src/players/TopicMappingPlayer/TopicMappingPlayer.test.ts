// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import FakePlayer from "@foxglove/studio-base/components/MessagePipeline/FakePlayer";
import { TopicMappingPlayer } from "@foxglove/studio-base/players/TopicMappingPlayer/TopicMappingPlayer";
import { TopicMappers } from "@foxglove/studio-base/players/TopicMappingPlayer/mapping";
import { PlayerProblem, PlayerState, Topic } from "@foxglove/studio-base/players/types";

import { mockMessage, mockPlayerState } from "./mocks";

describe("TopicMappingPlayer", () => {
  it("maps subscriptions", async () => {
    const fakePlayer = new FakePlayer();
    const mappers: TopicMappers = [
      { extensionId: "anh", mapper: () => new Map([["/original_topic_1", "/renamed_topic_1"]]) },
    ];
    const player = new TopicMappingPlayer(fakePlayer, mappers, {});
    player.setListener(async () => {});
    player.setSubscriptions([{ topic: "/renamed_topic_1" }, { topic: "/topic_2" }]);
    await fakePlayer.emit(
      mockPlayerState(undefined, {
        topics: [{ name: "/original_topic_1", schemaName: "any.schema" }],
      }),
    );
    expect(fakePlayer.subscriptions).toEqual([
      { topic: "/original_topic_1" },
      { topic: "/topic_2" },
    ]);
  });

  it("maps messages", async () => {
    const fakePlayer = new FakePlayer();
    const mappers: TopicMappers = [
      { extensionId: "any", mapper: () => new Map([["original_topic_1", "renamed_topic_1"]]) },
    ];
    const player = new TopicMappingPlayer(fakePlayer, mappers, {});
    const listener = jest.fn();
    player.setListener(listener);
    await fakePlayer.emit(
      mockPlayerState(undefined, {
        messages: [
          mockMessage("message", { topic: "original_topic_1" }),
          mockMessage("message", { topic: "topic_2" }),
        ],
        topics: [{ name: "original_topic_1", schemaName: "any.schema" }],
      }),
    );

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        activeData: expect.objectContaining({
          messages: [
            mockMessage("message", { topic: "original_topic_1" }),
            mockMessage("message", { topic: "renamed_topic_1" }),
            mockMessage("message", { topic: "topic_2" }),
          ],
          topics: [
            { name: "original_topic_1", schemaName: "any.schema" },
            {
              name: "renamed_topic_1",
              mappedFromName: "original_topic_1",
              schemaName: "any.schema",
            },
          ],
        }),
      }),
    );
  });

  it("marks disallowed mappings as player problems", async () => {
    const fakePlayer = new FakePlayer();
    const mappers: TopicMappers = [
      {
        extensionId: "ext1",
        mapper: () =>
          new Map([
            ["original_topic_1", "renamed_topic_1"],
            ["original_topic_2", "original_topic_1"],
          ]),
      },
      { extensionId: "ext2", mapper: () => new Map([["original_topic_2", "renamed_topic_1"]]) },
    ];
    const player = new TopicMappingPlayer(fakePlayer, mappers, {});
    let problems: undefined | PlayerProblem[] = [];
    const listener = async (state: PlayerState) => {
      problems = state.problems;
    };
    player.setListener(listener);
    await fakePlayer.emit(
      mockPlayerState(undefined, {
        messages: [mockMessage("message", { topic: "original_topic_1" })],
        topics: [
          { name: "original_topic_1", schemaName: "schema1" },
          { name: "original_topic_2", schemaName: "schema2" },
        ],
      }),
    );

    expect(problems).toEqual([
      {
        message: "Disallowed topic mapping",
        tip: "Extension ext1 mapped topic original_topic_2 is already present in the data source.",
        severity: "error",
      },
      {
        message: "Disallowed topic mapping",
        tip: "Extension ext2 requested duplicate mapping from topic original_topic_2 to topic renamed_topic_1.",
        severity: "error",
      },
    ]);
  });

  it("maps blocks", async () => {
    const fakePlayer = new FakePlayer();
    const mappers: TopicMappers = [
      { extensionId: "any", mapper: () => new Map([["/topic_1", "/renamed_topic_1"]]) },
    ];

    const player = new TopicMappingPlayer(fakePlayer, mappers, {});
    const listener = jest.fn();
    player.setListener(listener);

    const topics: Topic[] = [
      { name: "/topic_1", schemaName: "whatever" },
      { name: "/topic_2", schemaName: "whatever" },
    ];

    const state = mockPlayerState(
      {
        progress: {
          fullyLoadedFractionRanges: [],
          messageCache: {
            startTime: { sec: 0, nsec: 1 },
            blocks: [
              {
                messagesByTopic: {
                  "/topic_1": [mockMessage("message", { topic: "/topic_1" })],
                  "/topic_2": [mockMessage("message", { topic: "/topic_2" })],
                },
                sizeInBytes: 0,
              },
            ],
          },
        },
      },
      { topics },
    );
    await fakePlayer.emit(state);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        progress: {
          fullyLoadedFractionRanges: [],
          messageCache: {
            startTime: { sec: 0, nsec: 1 },
            blocks: [
              {
                messagesByTopic: {
                  "/topic_1": [expect.objectContaining({ topic: "/topic_1" })],
                  "/renamed_topic_1": [expect.objectContaining({ topic: "/renamed_topic_1" })],
                  "/topic_2": [expect.objectContaining({ topic: "/topic_2" })],
                },
                sizeInBytes: 0,
              },
            ],
          },
        },
      }),
    );
  });
});
