// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

/**
 * A map that maintains a 1:1 mapping between keys and values and allows
 * lookups and deletes by either key or value.
 */
export class BiMap<TKey, TValue> {
  #map1 = new Map<TKey, TValue>();
  #map2 = new Map<TValue, TKey>();

  public get(key: TKey): TValue | undefined {
    return this.#map1.get(key);
  }

  public getByValue(value: TValue): TKey | undefined {
    return this.#map2.get(value);
  }

  public set(key: TKey, value: TValue): void {
    const prevKey = this.#map2.get(value);
    const prevValue = this.#map1.get(key);
    if (prevKey != undefined) {
      this.#map1.delete(prevKey);
    }
    if (prevValue != undefined) {
      this.#map2.delete(prevValue);
    }

    this.#map1.set(key, value);
    this.#map2.set(value, key);
  }

  public delete(key: TKey): void {
    const value = this.#map1.get(key);
    if (value != undefined) {
      this.#map1.delete(key);
      this.#map2.delete(value);
    }
  }

  public deleteByValue(value: TValue): void {
    const key = this.#map2.get(value);
    if (key != undefined) {
      this.#map2.delete(value);
      this.#map1.delete(key);
    }
  }

  public clear(): void {
    this.#map1.clear();
    this.#map2.clear();
  }
}
