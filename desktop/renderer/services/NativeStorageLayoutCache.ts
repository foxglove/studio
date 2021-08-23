// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { v4 as uuidv4 } from "uuid";

import Log from "@foxglove/log";
import {
  Layout,
  INamespacedLayoutStorage,
  LayoutID,
  ISO8601Timestamp,
} from "@foxglove/studio-base";

import { Storage } from "../../common/types";

const log = Log.getLogger(__filename);

function assertLayout(value: unknown): asserts value is Layout {
  if (typeof value !== "object" || value == undefined) {
    throw new Error("Invariant violation - layout item is not an object");
  }

  if (!("id" in value)) {
    throw new Error("Invariant violation - layout item is missing an id");
  }
}

// Implement a LayoutStorage interface over OsContext
export default class NativeStorageLayoutCache implements INamespacedLayoutStorage {
  private static STORE_PREFIX = "layouts-";

  private _ctx: Storage;

  constructor(storage: Storage) {
    this._ctx = storage;
  }

  async list(namespace: string): Promise<readonly Layout[]> {
    const items = await this._ctx.all(NativeStorageLayoutCache.STORE_PREFIX + namespace);

    const layouts: Layout[] = [];
    for (const item of items) {
      if (!(item instanceof Uint8Array)) {
        throw new Error("Invariant violation - layout item is not a buffer");
      }

      try {
        const str = new TextDecoder().decode(item);
        const parsed = JSON.parse(str);
        assertLayout(parsed);
        layouts.push(parsed);
      } catch (err) {
        log.error(err);
      }
    }

    return layouts;
  }

  async create(
    namespace: string,
    layout: Pick<Layout, "name" | "data" | "permission" | "baselineId">,
  ): Promise<Layout> {
    const id = uuidv4() as LayoutID;
    const now = new Date().toISOString() as ISO8601Timestamp;
    const newLayout = { ...layout, id, createdAt: now, updatedAt: now };
    await this._ctx.put(
      NativeStorageLayoutCache.STORE_PREFIX + namespace,
      id,
      JSON.stringify(newLayout),
    );
    return newLayout;
  }

  async get(namespace: string, id: LayoutID): Promise<Layout | undefined> {
    const item = await this._ctx.get(NativeStorageLayoutCache.STORE_PREFIX + namespace, id);
    if (item == undefined) {
      return undefined;
    }
    if (!(item instanceof Uint8Array)) {
      throw new Error("Invariant violation - layout item is not a buffer");
    }

    const str = new TextDecoder().decode(item);
    const parsed = JSON.parse(str);
    assertLayout(parsed);
    return parsed;
  }

  async put(namespace: string, layout: Layout): Promise<Layout> {
    const content = JSON.stringify(layout);
    await this._ctx.put(NativeStorageLayoutCache.STORE_PREFIX + namespace, layout.id, content);
    return layout;
  }

  async delete(namespace: string, id: LayoutID): Promise<void> {
    return await this._ctx.delete(NativeStorageLayoutCache.STORE_PREFIX + namespace, id);
  }
}
