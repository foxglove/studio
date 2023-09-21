// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

type Entries<T> = {
  [K in keyof T]: [K, T[K]];
}[keyof T][];

/**
 * Version of Object.entries that retains typings of keys & values.
 */
export function recordEntries<K extends number | string | symbol, V, T extends Record<K, V>>(
  obj: T,
): Entries<T> {
  return Object.entries(obj) as Entries<T>;
}
