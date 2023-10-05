// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { MessageBlock } from "@foxglove/studio-base/PanelAPI/useBlocksSubscriptions";
import { SubscribePayload } from "@foxglove/studio-base/players/types";
import { initBlockState, processBlocks, refreshBlockTopics } from "./blocks";
import { fromSec } from "@foxglove/rostime";

const FAKE_TOPIC = "/foo";
const createSubscription = (topic: string): SubscribePayload => ({
  topic,
});

const createBlock = (topic: string, value: unknown): MessageBlock => ({
  [topic]: [
    {
      topic,
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

  it("should send data as it arrives", () => {
    const block = createBlock(FAKE_TOPIC, 1);
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
      expect(newData).toEqual([
        {
          [FAKE_TOPIC]: block[FAKE_TOPIC],
        },
      ]);
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
      expect(newData).toEqual([
        {
          [FAKE_TOPIC]: block[FAKE_TOPIC],
        },
      ]);
    }
  });
});
