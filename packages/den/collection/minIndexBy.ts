// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

function minIndexBy<T>(collection: Array<T>, compare: (itemA: T, itemB: T) => number): number {
  if (collection.length === 0) {
    return -1;
  }

  let minIdx = 0;
  let minItem = collection[0]!;

  for (let i = 1; i < collection.length; ++i) {
    const item = collection[i]!;
    if (compare(item, minItem) < 0) {
      minIdx = i;
      minItem = item;
    }
  }

  return minIdx;
}

export { minIndexBy };
