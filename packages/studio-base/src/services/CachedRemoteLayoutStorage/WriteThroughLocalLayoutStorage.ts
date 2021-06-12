// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { LocalLayout, LocalLayoutStorage } from "@foxglove/studio-base/services/LocalLayoutStorage";

import LazilyInitialized from "./LazilyInitialized";

/**
 * A view of LocalLayoutStorage which only calls the underlying list() once, and implements all
 * operations on the cached data in memory as well as writing through to the underlying storage.
 *
 * For this to be useful, we must assume nothing else is accessing the same underlying storage.
 */
export default class WriteThroughLocalLayoutStorage implements LocalLayoutStorage {
  private cache: LazilyInitialized<Map<string, LocalLayout>>;

  constructor(private storage: LocalLayoutStorage) {
    this.cache = new LazilyInitialized(() =>
      this.storage.list().then((layouts) => new Map(layouts.map((layout) => [layout.id, layout]))),
    );
  }

  async list(): Promise<readonly LocalLayout[]> {
    return Array.from((await this.cache.get()).values());
  }

  async get(id: string): Promise<LocalLayout | undefined> {
    return (await this.cache.get()).get(id);
  }

  async put(layout: LocalLayout): Promise<void> {
    await this.storage.put(layout);
    (await this.cache.get()).set(layout.id, layout);
  }

  async delete(id: string): Promise<void> {
    await this.storage.delete(id);
    (await this.cache.get()).delete(id);
  }
}
