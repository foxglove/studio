// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { fromSec } from "@foxglove/rostime";
import { MessageBlock } from "@foxglove/studio-base/PanelAPI/useBlocksSubscriptions";
import { SubscribePayload } from "@foxglove/studio-base/players/types";

import { initBlockState, processBlocks, refreshBlockTopics } from "./blocks";

const FAKE_TOPIC = "/foo";
const createSubscription = (topic: string): SubscribePayload => ({
  topic,
});

const createBlock = (value: unknown): MessageBlock => ({
  [FAKE_TOPIC]: [
    {
      topic: FAKE_TOPIC,
      schemaName: "",
      sizeInBytes: 0,
      message: value,
      receiveTime: fromSec(0),
    },
  ],
});

describe("refreshBlockTopics", () => {
  it("should clear out unused topics and add new ones", () => {
    const { messages, cursors } = refreshBlockTopics([createSubscription(FAKE_TOPIC)], {
      messages: [
        {
          "/bar": "baz",
        },
      ],
      cursors: {
        "/bar": 0,
      },
    });
    expect(messages).toEqual([{ [FAKE_TOPIC]: undefined }]);
    expect(cursors).toEqual({ [FAKE_TOPIC]: 0 });
  });
});

describe("processBlocks", () => {
  const subscriptions: SubscribePayload[] = [createSubscription(FAKE_TOPIC)];
  const initial = refreshBlockTopics(subscriptions, initBlockState());
  const block = createBlock(1);

  it("should send data as it arrives", () => {
    const first = processBlocks([block, {}], subscriptions, initial);
    {
      const {
        state: { messages, cursors },
        resetTopics,
        newData,
      } = first;
      expect(messages[0]?.[FAKE_TOPIC]).toEqual(1);
      expect(cursors[FAKE_TOPIC]).toEqual(1);
      expect(resetTopics).toEqual([]);
      expect(newData).toEqual([block]);
    }

    const second = processBlocks([block, block], subscriptions, first.state);
    {
      const {
        state: { messages, cursors },
        resetTopics,
        newData,
      } = second;
      expect(messages[1]?.[FAKE_TOPIC]).toEqual(1);
      expect(cursors[FAKE_TOPIC]).toEqual(2);
      expect(resetTopics).toEqual([]);
      expect(newData).toEqual([block]);
    }
  });

  it("should skip empty blocks", () => {
    const {
      state: { messages, cursors },
      resetTopics,
      newData,
    } = processBlocks([block, {}, block, {}], subscriptions, initial);
    expect(messages[2]?.[FAKE_TOPIC]).toEqual(1);
    expect(cursors[FAKE_TOPIC]).toEqual(3);
    expect(resetTopics).toEqual([]);
    expect(newData).toEqual([block, block]);
  });

  it("should not send data beyond changed data if change is from beginning", () => {
    const newBlock = createBlock(2);

    // we have loaded a full range of data
    const before = processBlocks([block, block, block], subscriptions, initial);

    // suddenly we get new data starting from the beginning, which we take to
    // mean that all of the subsequent data will change, too
    const first = processBlocks([newBlock, newBlock, block], subscriptions, before.state);
    {
      const {
        state: { messages, cursors },
        resetTopics,
        newData,
      } = first;
      expect(messages[1]?.[FAKE_TOPIC]).toEqual(2);
      expect(cursors[FAKE_TOPIC]).toEqual(2);
      expect(resetTopics).toEqual([FAKE_TOPIC]);
      expect(newData).toEqual([newBlock, newBlock]);
    }

    const second = processBlocks([newBlock, newBlock, newBlock], subscriptions, first.state);
    {
      const {
        state: { messages, cursors },
        resetTopics,
        newData,
      } = second;
      expect(messages[2]?.[FAKE_TOPIC]).toEqual(2);
      expect(cursors[FAKE_TOPIC]).toEqual(3);
      expect(resetTopics).toEqual([]);
      expect(newData).toEqual([newBlock]);
    }
  });

  it("should resend all data if there is a change in the middle", () => {
    const newBlock = createBlock(2);

    const before = processBlocks([block, block, block], subscriptions, initial);
    const after = processBlocks([block, newBlock, block], subscriptions, before.state);
    {
      const {
        state: { messages, cursors },
        resetTopics,
        newData,
      } = after;
      expect(messages[1]?.[FAKE_TOPIC]).toEqual(2);
      expect(cursors[FAKE_TOPIC]).toEqual(3);
      expect(resetTopics).toEqual([FAKE_TOPIC]);
      expect(newData).toEqual([block, newBlock, block]);
    }
  });
});
