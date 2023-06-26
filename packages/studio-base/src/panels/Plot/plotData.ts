// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import memoizeWeak from "memoize-weak";

import { MessageEvent } from "@foxglove/studio";
import { MessageDataItemsByPath } from "@foxglove/studio-base/components/MessagePathSyntax/useCachedGetMessagePathDataItems";
import { PlotDataByPath } from "@foxglove/studio-base/panels/Plot/internalTypes";
import { getTimestampForMessage } from "@foxglove/studio-base/util/time";

/**
 * Fetch the data we need from each item in itemsByPath and discard the rest of
 * the message to save memory.
 */
const getByPath = (itemsByPath: MessageDataItemsByPath): PlotDataByPath => {
  const ret: PlotDataByPath = {};
  Object.entries(itemsByPath).forEach(([path, items]) => {
    ret[path] = items.map((messageAndData) => {
      const headerStamp = getTimestampForMessage(messageAndData.messageEvent.message);
      return {
        queriedData: messageAndData.queriedData,
        receiveTime: messageAndData.messageEvent.receiveTime,
        headerStamp,
      };
    });
  });
  return ret;
};

const getMessagePathItems = memoizeWeak(
  (
    decodeMessagePathsForMessagesByTopic: (
      Record: Record<string, readonly MessageEvent[]>,
    ) => MessageDataItemsByPath,
    messages: Record<string, readonly MessageEvent[]>,
  ): PlotDataByPath => {
    return Object.freeze(getByPath(decodeMessagePathsForMessagesByTopic(messages)));
  },
);

/**
 * Fetch all the plot data we want for our current subscribed topics from blocks.
 */
export function getBlockItemsByPath(
  decodeMessagePathsForMessagesByTopic: (
    msgs: Record<string, readonly MessageEvent[]>,
  ) => MessageDataItemsByPath,
  messages: Record<string, readonly MessageEvent[]>,
): PlotDataByPath {
  return getMessagePathItems(decodeMessagePathsForMessagesByTopic, messages);
}

/**
 * Merge two PlotDataByPath objects into a single PlotDataByPath object,
 * discarding any overlapping messages between the two items.
 */
// function mergeByPath(a: Im<PlotDataByPath>, b: Im<PlotDataByPath>): Im<PlotDataByPath> {
//   return assignWith(
//     {},
//     a,
//     b,
//     (objValue: undefined | PlotDataItem[][], srcValue: undefined | PlotDataItem[][]) => {
//       if (objValue == undefined) {
//         return srcValue;
//       }
//       const lastTime = last(last(objValue))?.receiveTime ?? MIN_TIME;
//       const newValues = filterMap(srcValue ?? [], (item) => {
//         const laterDatums = item.filter((datum) => isGreaterThan(datum.receiveTime, lastTime));
//         return laterDatums.length > 0 ? laterDatums : undefined;
//       });
//       return newValues.length > 0 ? objValue.concat(newValues) : objValue;
//     },
//   );
// }

// const memoFindTimeRanges = memoizeWeak(findTimeRanges);

// Sort by start time, then end time, so that folding from the left gives us the
// right consolidated interval.
// function compare(a: Im<PlotDataByPath>, b: Im<PlotDataByPath>): number {
//   const rangeA = memoFindTimeRanges(a).all;
//   const rangeB = memoFindTimeRanges(b).all;
//   const startCompare = compareTimes(rangeA.start, rangeB.start);
//   return startCompare !== 0 ? startCompare : compareTimes(rangeA.end, rangeB.end);
// }

/**
 * Reduce multiple PlotDataByPath objects into a single PlotDataByPath object,
 * concatenating messages for each path after trimming messages that overlap
 * between items.
 */
// export function combine(data: Im<PlotDataByPath[]>): Im<PlotDataByPath> {
//   const sorted = data.slice().sort(compare);

//   const reduced = sorted.reduce((acc, item) => {
//     if (isEmpty(acc)) {
//       return item;
//     }
//     return mergeByPath(acc, item);
//   }, {} as PlotDataByPath);

//   return reduced;
// }
