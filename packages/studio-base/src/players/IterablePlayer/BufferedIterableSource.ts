// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { isEqual } from "lodash";

import { signal, Signal } from "@foxglove/den/async";
import Log from "@foxglove/log";
import { subtract, add as addTime, toNanoSec, compare, fromNanoSec } from "@foxglove/rostime";
import { Time, MessageEvent } from "@foxglove/studio";
import { Range } from "@foxglove/studio-base/util/ranges";

import {
  GetBackfillMessagesArgs,
  IIterableSource,
  Initalization,
  IteratorResult,
  MessageIteratorArgs,
} from "./IIterableSource";

const log = Log.getLogger(__filename);

// An individual cache item represents a continues range of CacheIteratorItems
type CacheBlock = {
  // The start time of the cache item (inclusive).
  //
  // When reading a data source, the first message may come after the requested "start" time.
  // The start field is the request start time while the first item in items would be the first message
  // which may be after this time.
  //
  // The start time is <= first item time.
  start: Time;

  // The end time (inclusive) of the last message within the cache item. Similar to start, the data source
  // may "end" after the last message so.
  //
  // The end time is >= last item time.
  end: Time;

  // Sorted cache item tuples. The first value is the timestamp of the iterator result and the second is the result.
  items: [bigint, IteratorResult][];

  // If the block has fully finished buffering and will have no more items added
  done: boolean;
};

/**
 * Performs a binary search on cache to find the index of the entry with the given key.
 *
 * Copied from @foxglove/den/collection ArrayMap
 *
 * @param key Key to search for.
 * @returns The index of the key/value tuple if an exact match is found; otherwise, a negative
 * number. If the key is not found and the key is less than one or more keys in the list, the
 * negative number returned is the bitwise complement of the index of the first element with a
 * larger key. If the key is not found and is greater than all keys in the list, the negative
 * number returned is the bitwise complement of the index of the last element plus 1.
 */
function findCacheItem(items: [bigint, IteratorResult][], key: bigint) {
  const list = items;
  if (list.length === 0) {
    return -1;
  }

  let left = 0;
  let right = list.length - 1;

  while (left <= right) {
    const mid = (left + right) >> 1;
    const midKey = list[mid]![0];

    if (midKey === key) {
      return mid;
    } else if (key < midKey) {
      right = mid - 1;
    } else {
      left = mid + 1;
    }
  }

  return ~left;
}

/**
 * BufferedIterableSource proxies access to IIterableSource through a memory buffer.
 *
 * The architecture of BufferedIterableSource follows a producer-consumer model. The messageIterator
 * is the consumer and reads messages from cache while the startProducer method produces messages by
 * reading from the underlying source and populating the cache.
 */
class BufferedIterableSource implements IIterableSource {
  private source: IIterableSource;

  private readDone = false;
  private aborted = false;
  private active = false;

  // The producer uses this signal to notify a waiting consumer there is data to consume.
  private readSignal?: Signal<void>;

  // The consumer uses this signal to notify a waiting producer that something has been consumed.
  // fixme - can I remove this?
  private writeSignal?: Signal<void>;

  // Stores which topics we have been caching. See notes at usage site for why we store this.
  private cachedTopics: string[] = [];

  // The producer loads results into the cache and the consumer reads from the cache.
  private cache: CacheBlock[] = [];

  // Cached range is the start/end ranges of the data we have in our cache
  private loadedRangesCache: Range[] = [{ start: 0, end: 0 }];

  // Keep caching more data until the cache has reached this time. As the cache is read, this time moves forward
  // to let the loading "process" know it should fetch more data
  private cacheUntilTime: Time = { sec: 0, nsec: 0 };

  // The promise for the current producer. The message generator starts a producer and awaits the
  // producer before exiting.
  private producer?: Promise<void>;

  private initResult?: Initalization;

  constructor(source: IIterableSource) {
    this.source = source;
  }

  async initialize(): Promise<Initalization> {
    this.initResult = await this.source.initialize();
    return this.initResult;
  }

  loadedRanges(): Range[] {
    return this.loadedRangesCache;
  }

  async startProducer(args: MessageIteratorArgs): Promise<void> {
    if (!this.initResult) {
      throw new Error("Invariant: uninitialized");
    }

    if (args.topics.length === 0) {
      this.readDone = true;
      return;
    }

    log.debug("Starting producer");

    const newTopics = [...args.topics].sort();

    // When the list of topics we want changes we purge the entire cache and start again.
    // This is heavy-handed but avoids dealing with how to handle disjoint cached ranges across topics.
    if (!isEqual(newTopics, this.cachedTopics)) {
      log.debug("topics changed - clearing cache, resetting range");

      this.cachedTopics = newTopics;

      // clear the cache
      this.cache.length = 0;
    }

    // Where to start buffering from
    let bufferStart = args.start ?? this.initResult.start;

    this.readDone = false;

    // lookup the cache block for our stamp
    let cacheBlockIndex = this.cache.findIndex((item) => {
      return compare(item.start, bufferStart) <= 0 && compare(item.end, bufferStart) >= 0;
    });

    let block = this.cache[cacheBlockIndex];

    // There's no block with our desired start time, we need to make one and insert it at the right
    // place. The right place is before the start time of a block that starts after our new start time.
    if (!block) {
      block = {
        start: bufferStart,
        end: bufferStart,
        items: [],
        done: false,
      };

      const insertIndex = this.cache.findIndex((item) => {
        // Find the first index where bufferStart is less than an existing start
        return compare(bufferStart, item.start) <= 0;
      });

      if (insertIndex < 0) {
        cacheBlockIndex = this.cache.length;
        this.cache.push(block);
      } else {
        cacheBlockIndex = insertIndex;
        // add the new cache block before the existing block
        this.cache.splice(cacheBlockIndex, 0, block);
      }

      this.recomputeLoadedRangeCache();
    }

    for (let cbi = cacheBlockIndex; cbi < this.cache.length; ++cbi) {
      block = this.cache[cbi];
      if (!block) {
        break;
      }

      try {
        const nextBlock = this.cache[cbi + 1];

        // If there's a block that follows ours then we only need to read _up to_ its start time
        const end = nextBlock
          ? subtract(nextBlock.start, { sec: 0, nsec: 1 })
          : this.initResult.end;

        // fixme - need to start reading 1 nanosecond after end and flush same nanosecond time messages
        bufferStart = block.end;

        // If we've already read through the end for this block then we move on to the next block
        if (compare(bufferStart, end) >= 0) {
          block.done = true;
          continue;
        }

        // Maybe this block was marked as done before (if we exiting buffering), but we've now
        // come back to this block and plan to load more from it.
        block.done = false;

        const sourceIterator = this.source.messageIterator({
          topics: args.topics,
          start: bufferStart,
          end,
        });

        // The cache is indexed on time, but iterator results that are problems might not have a time.
        // For these we use the lastTime that we knew about (or had a message for).
        // This variable tracks the last known time from a read.
        let lastTime = toNanoSec(bufferStart);

        const blockItems = block.items;

        for (;;) {
          if (this.aborted) {
            cbi = Number.MAX_VALUE;
            break;
          }

          const lastResult = blockItems[blockItems.length - 1];
          const msgEvent = lastResult?.[1].msgEvent;

          // If the last message we have has a receive time after readUntil, then there's no reading for us to do
          // We wait until the readUntil moved forward
          if (msgEvent && compare(msgEvent.receiveTime, this.cacheUntilTime) >= 0) {
            this.writeSignal = signal();
            await this.writeSignal;
            this.writeSignal = undefined;

            continue;
          }

          const result = await sourceIterator.next();
          if (result.done === true) {
            // When we are done reading from our iterator, we know we've reached the last time for our source
            // even if the last message was before the last time, we set the range to the end time
            block.end = end;
            this.recomputeLoadedRangeCache();
            break;
          }

          // If we have a message event, then we update our known time to this message event
          if (result.value.msgEvent) {
            block.end = result.value.msgEvent.receiveTime;
            lastTime = toNanoSec(result.value.msgEvent.receiveTime);
          }

          this.recomputeLoadedRangeCache();

          // Update the cache
          blockItems.push([lastTime, result.value]);

          // Indicate to the consumer that it can try reading again
          this.readSignal?.resolve();

          // If there's no msgEvent or if the receive time is before our readUntil, keep reading
          if (
            !result.value.msgEvent ||
            compare(result.value.msgEvent.receiveTime, this.cacheUntilTime) < 0
          ) {
            continue;
          }

          // fixme - why do we wait on reading to buffer more data?
          //this.writeSignal = signal();
          //await this.writeSignal;
          //this.writeSignal = undefined;
        }

        await sourceIterator.return?.();
      } catch (error) {
        // fixme - without this catch, errors in _next_ call were lost?
      } finally {
        block.done = true;

        this.readDone = true;
        this.readSignal?.resolve();
      }
    }

    log.debug("producer done");
  }

  async stopProducer(): Promise<void> {
    this.aborted = true;
    this.writeSignal?.resolve();
    await this.producer;
  }

  messageIterator(args: MessageIteratorArgs): AsyncIterator<Readonly<IteratorResult>> {
    if (!this.initResult) {
      throw new Error("Invariant: uninitialized");
    }

    if (this.active) {
      throw new Error("Invariant: BufferedIterableSource allows only one messageIterator");
    }

    const start = args.start ?? this.initResult.start;

    // Setup the initial cacheUntilTime to start buffing data
    this.cacheUntilTime = addTime(start, { sec: 5, nsec: 0 });

    this.aborted = false;

    // Create and start the producer when the messageIterator function is called.
    this.producer = this.startProducer(args);

    // Rather than messageIterator itself being a generator, we return a generator function. This is
    // so the setup code above will run when the messageIterator is called rather than when .next()
    // is called the first time. This behavior is important because we want the producer to start
    // producing immediately.
    //
    // Alias `this` to `self` for use in the generator function because we can't make fat-arrow
    // generator functions
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return (async function* bufferedIterableGenerator() {
      self.active = true;

      try {
        if (args.topics.length === 0) {
          return;
        }

        let cacheBlockIndex: number = -1;

        for (;;) {
          cacheBlockIndex = self.cache.findIndex((item) => {
            return compare(item.start, start) <= 0 && compare(item.end, start) >= 0;
          });

          // There's no cache item for us to read from yet so we need to wait until one becomes available
          if (cacheBlockIndex < 0) {
            self.readSignal = signal();
            await self.readSignal;
            self.readSignal = undefined;

            continue;
          }

          break;
        }

        let cacheBlock = self.cache[cacheBlockIndex];
        // Somehow we ended up finding an index that doesn't exist - shouldn't happen
        if (!cacheBlock) {
          throw new Error("Invariant: cache item should exist at index");
        }

        // Find the start index within the cache block where our item lives
        let cacheIndex = findCacheItem(cacheBlock.items, toNanoSec(start));
        if (cacheIndex < 0) {
          cacheIndex = ~cacheIndex;
        }

        for (;;) {
          if (!cacheBlock) {
            break;
          }

          // Load the cached item
          const result = cacheBlock.items[cacheIndex];

          // Tell the producer we've consumed something
          self.writeSignal?.resolve();

          if (!result) {
            // This block is done loading but there might be another one after it. Try reading that
            // block from its first item.
            if (cacheBlock.done) {
              cacheIndex = 0;
              cacheBlockIndex += 1;
              cacheBlock = self.cache[cacheBlockIndex];
              continue;
            }

            if (self.readDone) {
              break;
            }

            // We didn't get a result at the index we want, we need to wait for more data
            self.readSignal = signal();
            await self.readSignal;
            self.readSignal = undefined;
            continue;
          }

          self.cacheUntilTime = addTime(fromNanoSec(result[0]), { sec: 5, nsec: 0 });

          // Increment to the next cache item
          cacheIndex += 1;

          yield result[1];
        }
      } finally {
        log.debug("ending buffered message iterator");
        await self.stopProducer();
        self.active = false;
      }
    })();
  }

  async getBackfillMessages(args: GetBackfillMessagesArgs): Promise<MessageEvent<unknown>[]> {
    if (!this.initResult) {
      throw new Error("Invariant: uninitialized");
    }

    // Find a block that contains our time, if we don't have a block that contains the end time
    // then we can't know that we will load the backfill messages correctly
    const cacheBlockIndex = this.cache.findIndex((item) => {
      return compare(item.start, args.time) <= 0 && compare(item.end, args.time) >= 0;
    });

    const out: MessageEvent<unknown>[] = [];
    const needsTopics = new Set(args.topics);

    const cacheBlock = this.cache[cacheBlockIndex];
    if (cacheBlock) {
      let readIdx = findCacheItem(cacheBlock.items, toNanoSec(args.time));

      // If readIdx is negative then we don't have an exact match, but readIdx does tell us what that is
      // See the binarySearch documentation for how to interpret it.
      if (readIdx < 0) {
        readIdx = ~readIdx;

        // readIdx will point to the element after our time (or 1 past the end of the array)
        // We subtract 1 to start reading from before that element or end of array
        readIdx -= 1;
      }

      for (let i = readIdx; i >= 0; --i) {
        const record = cacheBlock.items[i];
        if (!record || !record[1].msgEvent) {
          continue;
        }

        const msgEvent = record[1].msgEvent;

        if (needsTopics.has(msgEvent.topic)) {
          needsTopics.delete(msgEvent.topic);
        }
        out.push(msgEvent);
      }
    }

    // If we found all our topics from our cache then we don't need to fallback to the source
    if (needsTopics.size === 0) {
      return out;
    }

    // fallback to the source for any topics we weren't able to load
    const sourceBackfill = await this.source.getBackfillMessages({
      ...args,
      topics: Array.from(needsTopics),
    });

    out.push(...sourceBackfill);
    out.sort((a, b) => compare(a.receiveTime, b.receiveTime));

    return out;
  }

  private recomputeLoadedRangeCache(): void {
    if (!this.initResult) {
      throw new Error("Invariant: uninitialized");
    }

    // The nanosecond time of the start of the source
    const sourceStartNs = toNanoSec(this.initResult.start);

    const rangeNs = Number(toNanoSec(subtract(this.initResult.end, this.initResult.start)));
    if (rangeNs === 0) {
      this.loadedRangesCache = [{ start: 0, end: 1 }];
      return;
    }

    if (this.cache.length === 0) {
      this.loadedRangesCache = [{ start: 0, end: 0 }];
      return;
    }

    this.loadedRangesCache = this.cache.map((block) => {
      const start = Number(toNanoSec(block.start) - sourceStartNs) / rangeNs;
      const end = Number(toNanoSec(block.end) - sourceStartNs) / rangeNs;
      return { start, end };
    });
  }
}

export { BufferedIterableSource };
