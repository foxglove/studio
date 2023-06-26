// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { DeepReadonly as Immutable } from "ts-essentials";

/**
 * Function to iterate and call function over multiple sorted arrays in sorted order across all items in all arrays.
 * Time complexity is O(t*n) where t is the number of arrays and n is the total number of items in all arrays.
 * Space complexity is O(t) where t is the number of arrays.
 * @param arrays - sorted arrays to iterate over
 * @param compareFn - function called to compare items in arrays. Returns a positive value if left is larger than right,
 *  a negative value if right is larger than left, or zero if both are equal
 * @param forEach - callback to be executed on all items in the arrays to iterate over in sorted order across all arrays
 */
export function forEachSortedArrays<Item>(
  arrays: Immutable<Item[][]>,
  compareFn: (a: Immutable<Item>, b: Immutable<Item>) => number,
  forEach: (item: Immutable<Item>) => void,
): void {
  const cursors: number[] = Array(arrays.length).fill(0);
  if (arrays.length === 0) {
    return;
  }
  for (;;) {
    let minCursorIndex = undefined;
    for (let i = 0; i < cursors.length; i++) {
      const cursor = cursors[i]!;
      const array = arrays[i]!;
      if (cursor >= array.length) {
        continue;
      }
      const item = array[cursor]!;
      if (minCursorIndex == undefined) {
        minCursorIndex = i;
      } else {
        const minItem = arrays[minCursorIndex]![cursors[minCursorIndex]!]!;
        if (compareFn(item, minItem) < 0) {
          minCursorIndex = i;
        }
      }
    }
    if (minCursorIndex == undefined) {
      break;
    }
    const minItem = arrays[minCursorIndex]![cursors[minCursorIndex]!];
    if (minItem != undefined) {
      forEach(minItem);
      cursors[minCursorIndex]++;
    } else {
      break;
    }
  }
}
