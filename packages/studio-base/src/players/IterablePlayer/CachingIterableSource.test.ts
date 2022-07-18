// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { MessageEvent } from "@foxglove/studio";

import { CachingIterableSource } from "./CachingIterableSource";
import {
  GetBackfillMessagesArgs,
  IIterableSource,
  Initalization,
  MessageIteratorArgs,
  IteratorResult,
} from "./IIterableSource";

class TestSource implements IIterableSource {
  async initialize(): Promise<Initalization> {
    return {
      start: { sec: 0, nsec: 0 },
      end: { sec: 1, nsec: 0 },
      topics: [],
      topicStats: new Map(),
      profile: undefined,
      problems: [],
      datatypes: new Map(),
      publishersByTopic: new Map(),
    };
  }

  async *messageIterator(_args: MessageIteratorArgs): AsyncIterator<Readonly<IteratorResult>> {}

  async getBackfillMessages(_args: GetBackfillMessagesArgs): Promise<MessageEvent<unknown>[]> {
    return [];
  }
}

describe("BufferedIterableSource", () => {
  it("should construct and initialize", async () => {
    const source = new TestSource();
    const bufferedSource = new CachingIterableSource(source);

    await bufferedSource.initialize();
    expect(bufferedSource.loadedRanges()).toEqual([{ start: 0, end: 0 }]);
  });

  it("should produce messages that the source produces", async () => {
    const source = new TestSource();
    const bufferedSource = new CachingIterableSource(source);

    await bufferedSource.initialize();

    source.messageIterator = async function* messageIterator(
      _args: MessageIteratorArgs,
    ): AsyncIterator<Readonly<IteratorResult>> {
      for (let i = 0; i < 8; ++i) {
        yield {
          msgEvent: {
            topic: "a",
            receiveTime: { sec: 0, nsec: i * 1e8 },
            message: undefined,
            sizeInBytes: 0,
          },
          problem: undefined,
          connectionId: undefined,
        };
      }
    };

    {
      const messageIterator = bufferedSource.messageIterator({
        topics: ["a"],
      });

      // confirm messages are what we expect
      for (let i = 0; i < 8; ++i) {
        const iterResult = messageIterator.next();
        await expect(iterResult).resolves.toEqual({
          done: false,
          value: {
            problem: undefined,
            connectionId: undefined,
            msgEvent: {
              receiveTime: { sec: 0, nsec: i * 1e8 },
              message: undefined,
              sizeInBytes: 0,
              topic: "a",
            },
          },
        });
      }

      // The message iterator should be done since we have no more data to read from the source
      const iterResult = messageIterator.next();
      await expect(iterResult).resolves.toEqual({
        done: true,
      });

      expect(bufferedSource.loadedRanges()).toEqual([{ start: 0, end: 1 }]);
    }

    // because we have cached we shouldn't be calling source anymore
    source.messageIterator = function messageIterator(
      _args: MessageIteratorArgs,
    ): AsyncIterator<Readonly<IteratorResult>> {
      throw new Error("should not be called");
    };

    {
      const messageIterator = bufferedSource.messageIterator({
        topics: ["a"],
      });

      // confirm messages are what we expect
      for (let i = 0; i < 8; ++i) {
        const iterResult = messageIterator.next();
        await expect(iterResult).resolves.toEqual({
          done: false,
          value: {
            problem: undefined,
            connectionId: undefined,
            msgEvent: {
              receiveTime: { sec: 0, nsec: i * 1e8 },
              message: undefined,
              sizeInBytes: 0,
              topic: "a",
            },
          },
        });
      }

      // The message iterator should be done since we have no more data to read from the source
      const iterResult = messageIterator.next();
      await expect(iterResult).resolves.toEqual({
        done: true,
      });

      expect(bufferedSource.loadedRanges()).toEqual([{ start: 0, end: 1 }]);
    }
  });

  it("should yield correct messages when starting a new iterator before the the cached items", async () => {
    const source = new TestSource();
    const bufferedSource = new CachingIterableSource(source);

    await bufferedSource.initialize();

    {
      source.messageIterator = async function* messageIterator(
        _args: MessageIteratorArgs,
      ): AsyncIterator<Readonly<IteratorResult>> {
        yield {
          msgEvent: {
            topic: "a",
            receiveTime: { sec: 0, nsec: 500000000 },
            message: undefined,
            sizeInBytes: 0,
          },
          problem: undefined,
          connectionId: undefined,
        };
      };

      const messageIterator = bufferedSource.messageIterator({
        topics: ["a"],
        start: { sec: 0, nsec: 500000000 },
      });

      // Read one message
      {
        const iterResult = await messageIterator.next();
        expect(iterResult).toEqual({
          done: false,
          value: {
            problem: undefined,
            connectionId: undefined,
            msgEvent: {
              receiveTime: { sec: 0, nsec: 500000000 },
              message: undefined,
              sizeInBytes: 0,
              topic: "a",
            },
          },
        });
      }

      {
        const iterResult = await messageIterator.next();
        expect(iterResult).toEqual({
          done: true,
        });
      }

      expect(bufferedSource.loadedRanges()).toEqual([{ start: 0.5, end: 1 }]);
    }

    // A new message iterator at the start time should emit the new message
    {
      source.messageIterator = async function* messageIterator(
        _args: MessageIteratorArgs,
      ): AsyncIterator<Readonly<IteratorResult>> {
        yield {
          msgEvent: {
            topic: "a",
            receiveTime: { sec: 0, nsec: 1 },
            message: undefined,
            sizeInBytes: 0,
          },
          problem: undefined,
          connectionId: undefined,
        };
      };

      const messageIterator = bufferedSource.messageIterator({
        topics: ["a"],
        start: { sec: 0, nsec: 0 },
      });

      // Read one message
      {
        const iterResult = await messageIterator.next();
        expect(iterResult).toEqual({
          done: false,
          value: {
            problem: undefined,
            connectionId: undefined,
            msgEvent: {
              receiveTime: { sec: 0, nsec: 1 },
              message: undefined,
              sizeInBytes: 0,
              topic: "a",
            },
          },
        });
      }

      {
        const iterResult = await messageIterator.next();
        expect(iterResult).toEqual({
          done: false,
          value: {
            problem: undefined,
            connectionId: undefined,
            msgEvent: {
              receiveTime: { sec: 0, nsec: 500000000 },
              message: undefined,
              sizeInBytes: 0,
              topic: "a",
            },
          },
        });
      }

      {
        const iterResult = await messageIterator.next();
        expect(iterResult).toEqual({
          done: true,
        });
      }

      expect(bufferedSource.loadedRanges()).toEqual([
        { start: 0, end: 0.499999999 },
        { start: 0.5, end: 1 },
      ]);
    }
  });
});
