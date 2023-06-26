/** @jest-environment jsdom */
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { renderHook } from "@testing-library/react-hooks";

import { MessageBlock } from "@foxglove/studio-base/players/types";
import { mockMessage } from "@foxglove/studio-base/test/mocks/mockMessage";

import { useFlattenedBlocks } from "./useFlattenedBlocks";

describe("useFlattenedBlocks", () => {
  it("flattens blocks", () => {
    const initialBlocks: MessageBlock[] = [
      {
        messagesByTopic: {
          topic_a: [mockMessage("message", { topic: "topic_a" })],
        },
        needTopics: new Set(),
        sizeInBytes: 1,
      },
    ];

    const { result, rerender } = renderHook(
      ({ blocks }) => useFlattenedBlocks({ blocks, topics: ["topic_a"] }),
      { initialProps: { blocks: initialBlocks } },
    );

    expect(result.current).toEqual([expect.objectContaining({ topic: "topic_a" })]);

    const updatedBlocks: MessageBlock[] = [
      ...initialBlocks,
      {
        messagesByTopic: {
          topic_a: [mockMessage("message", { topic: "topic_a" })],
        },
        needTopics: new Set(),
        sizeInBytes: 1,
      },
      {
        messagesByTopic: {
          topic_a: [mockMessage("message", { topic: "topic_a" })],
        },
        needTopics: new Set("other_topic"),
        sizeInBytes: 1,
      },
    ];

    rerender({ blocks: updatedBlocks });

    expect(result.current).toEqual([
      expect.objectContaining({ topic: "topic_a" }),
      expect.objectContaining({ topic: "topic_a" }),
    ]);
  });
});
