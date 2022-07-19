// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { isEqual } from "lodash";

import Log from "@foxglove/log";
import { subtract, add, toNanoSec, compare } from "@foxglove/rostime";
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

// An individual cache item represents a continuous range of CacheIteratorItems
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

  // The last time this block was accessed.
  lastAccess: number;

  // The size of this block in bytes
  size: number;
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

  private totalSizeBytes: number = 0;

  // Maximum total cache size
  private maxTotalSizeBytes: number = 1e9;

  // Maximum size per block
  private maxBlockSizeBytes: number = 50000000;

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

    let sourceMessageIterator: AsyncIterator<Readonly<IteratorResult>> | undefined;
    try {
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

        // if the block start === end and done is false, then it could have been a new block we started but never
        // got around to adding any messages into, we remove it.
        if (block && compare(block.start, block.end) === 0 && block.items.length === 0) {
          block = undefined;
          this.cache.splice(cacheBlockIndex, 1);
          cacheBlockIndex = -1;
          continue;
        }

        let cacheIndex = -1;
        if (block) {
          cacheIndex = findCacheItem(block.items, toNanoSec(readHead));
          if (cacheIndex < 0) {
            cacheIndex = ~cacheIndex;
          }
        }
        let cachedItem = block?.items[cacheIndex];

        // We have a block found an item within the block.
        // Yield the rest of the block
        if (block && cachedItem) {
          // We have a cached item, we can consume our cache until we've read to the end
          for (let idx = cacheIndex; idx < block.items.length; ++idx) {
            cachedItem = block.items[idx];
            if (!cachedItem) {
              break;
            }

            // update the last time this block was accessed
            block.lastAccess = Date.now();

            // Increment to the next cache item
            cacheIndex += 1;
            yield cachedItem[1];
          }

          // We know that block.end represents the last messages possible in the block, so our
          // next read can start at 1 nanosecond after the end
          readHead = add(block.end, { sec: 0, nsec: 1 });
          continue;
        }

        let sourceReadStart = readHead;
        let sourceReadEnd = this.initResult.end;

        // We have a block that is not done, we continue from where we left off and read until the next block starts
        if (block) {
          // We start our read after the end of the block since block end has already included all those messages
          sourceReadStart = add(block.end, { sec: 0, nsec: 1 });

          const nextBlock = this.cache[cacheBlockIndex + 1];
          if (nextBlock) {
            sourceReadEnd = subtract(nextBlock.start, { sec: 0, nsec: 1 });
          }
        } else {
          // We do not have a block
          // We will insert a new block, and setup the source to read the range for the new block

          // Look for the block that we will insert our block before
          const insertIndex = this.cache.findIndex((item) => {
            // Find the first index where readHead is less than an existing start
            return compare(readHead, item.start) < 0;
          });

          // If we have a next block (this is the block ours would come before), then we only need
          // to read up to that block.
          const nextBlock = this.cache[insertIndex];
          if (nextBlock) {
            sourceReadEnd = subtract(nextBlock.start, { sec: 0, nsec: 1 });
          }

          if (compare(sourceReadStart, sourceReadEnd) > 0) {
            throw new Error("Invariant: sourceReadStart > sourceReadEnd");
          }

          // Our new block starts at sourceReadStart (has no end yet)
          const newBlock: CacheBlock = {
            start: sourceReadStart,
            end: sourceReadStart,
            items: [],
            size: 0,
            lastAccess: Date.now(),
          };

          if (insertIndex < 0) {
            cacheBlockIndex = this.cache.length;
            this.cache.push(newBlock);
          } else {
            cacheBlockIndex = insertIndex;
            // add the new cache block before the existing block
            this.cache.splice(cacheBlockIndex, 0, newBlock);
          }

          block = newBlock;
        }

        sourceMessageIterator = this.source.messageIterator({
          topics: this.cachedTopics,
          start: sourceReadStart,
          end: sourceReadEnd,
        });

        // The cache is indexed on time, but iterator results that are problems might not have a time.
        // For these we use the lastTime that we knew about (or had a message for).
        // This variable tracks the last known time from a read.
        let lastTime = toNanoSec(sourceReadStart);

        let pendingIterResults: [bigint, IteratorResult][] = [];

        for (;;) {
          const iterResult = await sourceMessageIterator.next();
          if (iterResult.done === true) {
            block.end = sourceReadEnd;

            // write any cached messages to the block since we know they occur <= end
            block.items.push(...pendingIterResults);
            pendingIterResults = [];

            readHead = add(block.end, { sec: 0, nsec: 1 });

            this.recomputeLoadedRangeCache();
            break;
          }

          const sizeInBytes = iterResult.value.msgEvent?.sizeInBytes ?? 0;

          // Determine if our total size would exceed max and purge the oldest block
          if (this.totalSizeBytes + sizeInBytes > this.maxTotalSizeBytes) {
            const res = this.cache.reduce<[number, number]>(
              (prev, curr, currIdx) => {
                if (curr.lastAccess < prev[1]) {
                  return [currIdx, curr.lastAccess];
                }

                return prev;
              },
              [-1, Number.MAX_SAFE_INTEGER],
            );

            const oldestIdx = res[0];

            if (oldestIdx === cacheBlockIndex) {
              throw new Error("Cannot evict the active cache block.");
            } else {
              const oldestBlock = this.cache[oldestIdx];
              if (oldestBlock) {
                cacheBlockIndex -= 1;
                this.totalSizeBytes -= oldestBlock.size;
                this.cache.splice(oldestIdx, 1);

                this.recomputeLoadedRangeCache();
              }
            }
          }

          // If we have a message event, then we update our known time to this message event
          if (iterResult.value.msgEvent) {
            const receiveTime = iterResult.value.msgEvent.receiveTime;
            const receiveTimeNs = toNanoSec(receiveTime);

            // There might be multiple messages at the same time, and since block end time
            // is inclusive we only update the end time once we've moved to the next time
            if (receiveTimeNs > lastTime) {
              // write any cached messages to the block
              block.items.push(...pendingIterResults);
              pendingIterResults.length = 0;

              // Set the end time to 1 nanosecond before the current receive time since we know we've
              // read up to this receive time.
              block.end = subtract(receiveTime, { sec: 0, nsec: 1 });

              lastTime = receiveTimeNs;
              this.recomputeLoadedRangeCache();
            }
          }

          // Store the latest message in pending results and flush to the block when time moves forward
          pendingIterResults.push([lastTime, iterResult.value]);

          // update the last time this block was accessed
          block.lastAccess = Date.now();

          this.totalSizeBytes += sizeInBytes;
          block.size += sizeInBytes;

          // When the block has grown too big, we introduce another block and continue caching into that.
          if (block.size > this.maxBlockSizeBytes) {
            // The new block starts right after our previous one
            readHead = add(block.end, { sec: 0, nsec: 1 });

            block = {
              start: readHead,
              end: readHead,
              items: [],
              size: 0,
              lastAccess: Date.now(),
            };

            cacheBlockIndex += 1;
            // This block needs to be after our current one
            this.cache.splice(cacheBlockIndex, 0, block);
          }

          yield iterResult.value;
        }
      }
    } finally {
      await sourceMessageIterator?.return?.();
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
