// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { isEqual } from "lodash";

import Log from "@foxglove/log";
import { subtract, add, toNanoSec, compare, fromNanoSec } from "@foxglove/rostime";
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
 * CachingIterableSource proxies access to IIterableSource through a memory buffer.
 *
 * Message reading occurs from the memory buffer containing previously read messages. If there is no
 * buffer for previously read messages, then the underlying source is used and the messages are
 * cached when read.
 */
class CachingIterableSource implements IIterableSource {
  private source: IIterableSource;

  // Stores which topics we have been caching. See notes at usage site for why we store this.
  private cachedTopics: string[] = [];

  // The producer loads results into the cache and the consumer reads from the cache.
  private cache: CacheBlock[] = [];

  // Cache of loaded ranges. Ranges correspond to the cache blocks and are normalized in [0, 1];
  private loadedRangesCache: Range[] = [{ start: 0, end: 0 }];

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

  async *messageIterator(args: MessageIteratorArgs): AsyncIterator<Readonly<IteratorResult>> {
    if (!this.initResult) {
      throw new Error("Invariant: uninitialized");
    }

    const newTopics = [...args.topics].sort();

    // When the list of topics we want changes we purge the entire cache and start again.
    // This is heavy-handed but avoids dealing with how to handle disjoint cached ranges across topics.
    if (!isEqual(newTopics, this.cachedTopics)) {
      log.debug("topics changed - clearing cache, resetting range");
      this.cachedTopics = newTopics;
      this.cache.length = 0;
    }

    // Where we want to read messages from. As we move through blocks and messages, the read head
    // moves forward to track the next place we should be reading.
    let readHead = args.start ?? this.initResult.start;

    for (;;) {
      if (compare(readHead, this.initResult.end) > 0) {
        break;
      }

      let cacheBlockIndex = this.cache.findIndex((item) => {
        return compare(item.start, readHead) <= 0 && compare(item.end, readHead) >= 0;
      });

      let block = this.cache[cacheBlockIndex];

      // There is no block for our start time, so we need to make one to contain our cached items
      if (!block) {
        block = {
          start: readHead,

          // fixme - I think this needs to be 1 _past_ the last read
          end: readHead,

          items: [],
          done: false,
        };

        const insertIndex = this.cache.findIndex((item) => {
          // Find the first index where bufferStart is less than an existing start
          return compare(readHead, item.start) <= 0;
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

      // lookup the cached result item
      let cacheIndex = findCacheItem(block.items, toNanoSec(readHead));
      if (cacheIndex < 0) {
        cacheIndex = ~cacheIndex;
      }

      let cachedItem = block.items[cacheIndex];

      if (cachedItem) {
        // We have a cached item, we can consume our cache until we've read to the end
        for (;;) {
          cachedItem = block.items[cacheIndex];
          if (!cachedItem) {
            break;
          }

          // Track the last result we've read so when we've run our of results we know where to start again
          readHead = add(fromNanoSec(cachedItem[0]), { sec: 0, nsec: 1 });

          // Increment to the next cache item
          cacheIndex += 1;
          yield cachedItem[1];
        }
      } else {
        // We don't have a cache item, we need to read from the underlying source

        if (block.done) {
          // fixme - can this happen? we have a done block and it didn't have our item?
          // how did we get this block in the first place?
          readHead = add(block.end, { sec: 0, nsec: 1 });
          continue;
        }

        const nextBlock = this.cache[cacheBlockIndex + 1];

        // If there's a block that follows ours then we only need to read _up to_ its start time
        const end = nextBlock
          ? subtract(nextBlock.start, { sec: 0, nsec: 1 })
          : this.initResult.end;

        // fixme - for empty blocks we ca'nt start at 1 nanosecond after end because
        // we haven't read that time yet
        const sourceStart = block.end;

        const sourceIterator = this.source.messageIterator({
          topics: this.cachedTopics,
          start: sourceStart,
          end,
        });

        // The cache is indexed on time, but iterator results that are problems might not have a time.
        // For these we use the lastTime that we knew about (or had a message for).
        // This variable tracks the last known time from a read.
        let lastTime = toNanoSec(sourceStart);

        for (;;) {
          const iterResult = await sourceIterator.next();
          if (iterResult.done === true) {
            block.end = end;
            block.done = true;
            this.recomputeLoadedRangeCache();

            readHead = add(block.end, { sec: 0, nsec: 1 });
            break;
          }

          // If we have a message event, then we update our known time to this message event
          if (iterResult.value.msgEvent) {
            lastTime = toNanoSec(iterResult.value.msgEvent.receiveTime);

            // fixme - update end only when we've moved to next time
            // must preserve semantic that end has been read completely
            block.end = iterResult.value.msgEvent.receiveTime;
            this.recomputeLoadedRangeCache();
          }

          // Update the cache
          // fixme - only update the cache when we've moved on to another time
          // because we have to preserve the semantic that _end_ has been read completely
          block.items.push([lastTime, iterResult.value]);

          yield iterResult.value;
        }
      }
    }
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

export { CachingIterableSource };
