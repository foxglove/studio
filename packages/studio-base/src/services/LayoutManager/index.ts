// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { v4 as uuidv4 } from "uuid";

import { MutexLocked } from "@foxglove/den/async";
import Logger from "@foxglove/log";
import { PanelsState } from "@foxglove/studio-base/context/CurrentLayoutContext/actions";
import { ISO8601Timestamp } from "@foxglove/studio-base/services/ConsoleApi";
import {
  ILayoutManager,
  DisplayedLayout,
  LayoutChangeListener,
} from "@foxglove/studio-base/services/ILayoutManager";
import { ILayoutStorage, LayoutID } from "@foxglove/studio-base/services/ILayoutStorage";

const log = Logger.getLogger(__filename);

export default class LayoutManager implements ILayoutManager {
  /**
   * All access to storage is wrapped in a mutex to prevent multi-step operations (such as reading
   * and then writing a single layout, or writing one and deleting another) from getting
   * interleaved.
   */
  private storage: MutexLocked<ILayoutStorage>;

  // FIXME remote layout support
  // private remoteStorage: IRemoteLayoutStorage;
  // private latestConflictsByCacheId: ReadonlyMap<string, ConflictInfo> = new Map();

  readonly supportsSharing = false; // FIXME remote layout support

  private changeListeners = new Set<LayoutChangeListener>();

  constructor({ storage }: { storage: ILayoutStorage }) {
    // FIXME: continue wrapping in WriteThrough layer?
    this.storage = new MutexLocked(storage);
  }

  addLayoutsChangedListener(listener: LayoutChangeListener): void {
    this.changeListeners.add(listener);
  }
  removeLayoutsChangedListener(listener: LayoutChangeListener): void {
    this.changeListeners.delete(listener);
  }
  private notifyChangeListeners(event: { updatedLayout: DisplayedLayout | undefined }) {
    queueMicrotask(() => {
      for (const listener of [...this.changeListeners]) {
        listener(event);
      }
    });
  }

  async getLayouts(): Promise<readonly DisplayedLayout[]> {
    return await this.storage.runExclusive(async (storage) =>
      (await storage.list()).filter((layout) => !(layout.locallyDeleted ?? false)),
    );
  }

  async getLayout(id: LayoutID): Promise<DisplayedLayout | undefined> {
    return await this.storage.runExclusive(async (storage) => {
      const layout = await storage.get(id);
      return layout?.locallyDeleted ?? false ? undefined : layout;
    });
  }

  async saveNewLayout({
    name,
    data,
    permission,
  }: {
    name: string;
    data: PanelsState;
    permission: "creator_write" | "org_read" | "org_write";
  }): Promise<DisplayedLayout> {
    // For shared layouts, start by going directly to the server
    if (permission !== "creator_write") {
      // FIXME: remote layout support
      throw new Error("Sharing is not supported");
    }
    const newLayout = await this.storage.runExclusive(
      async (storage) =>
        await storage.put({
          id: uuidv4() as LayoutID,
          name,
          permission,
          working: undefined,
          baseline: { data, updatedAt: new Date().toISOString() as ISO8601Timestamp },
          locallyDeleted: false,
        }),
    );
    this.notifyChangeListeners({ updatedLayout: newLayout });
    return newLayout;
  }

  async updateLayout({
    id,
    name,
    data,
    permission,
  }: {
    id: LayoutID;
    name: string | undefined;
    data: PanelsState | undefined;
    permission?: "creator_write" | "org_read" | "org_write";
  }): Promise<DisplayedLayout> {
    if (permission != undefined && permission !== "creator_write") {
      // FIXME: remote layout support
      throw new Error("Sharing is not supported");
    }

    const result = await this.storage.runExclusive(async (storage) => {
      const layout = await storage.get(id);
      if (!layout) {
        throw new Error(`Cannot update layout ${id} because it does not exist`);
      }
      const updatedLayout = {
        ...layout,
        name: name ?? layout.name,
        permission: permission ?? layout.permission,
      };
      if (data != undefined) {
        updatedLayout.working = { data, updatedAt: new Date().toISOString() as ISO8601Timestamp };
      }
      return await storage.put(updatedLayout);
    });
    this.notifyChangeListeners({ updatedLayout: result });
    return result;
  }

  async deleteLayout({ id }: { id: LayoutID }): Promise<void> {
    // FIXME: remote layouts: record tombstone and later delete on the server
    await this.storage.runExclusive(async (storage) => {
      const layout = await storage.get(id);
      if (!layout) {
        log.warn(`Cannot delete layout id ${id} because it does not exist`);
        return;
      }
      await storage.put({ ...layout, locallyDeleted: true });
    });
    this.notifyChangeListeners({ updatedLayout: undefined });
  }

  async overwriteLayout({ id }: { id: LayoutID }): Promise<DisplayedLayout> {
    // FIXME remote layout support
    const result = await this.storage.runExclusive(async (storage) => {
      const layout = await storage.get(id);
      if (!layout) {
        throw new Error(`Cannot overwrite layout id ${id} because it does not exist`);
      }
      return await storage.put({
        ...layout,
        baseline: layout.working ?? layout.baseline,
        working: undefined,
      });
    });
    this.notifyChangeListeners({ updatedLayout: result });
    return result;
  }

  async revertLayout({ id }: { id: LayoutID }): Promise<DisplayedLayout> {
    // FIXME remote layout support
    const result = await this.storage.runExclusive(async (storage) => {
      const layout = await storage.get(id);
      if (!layout) {
        throw new Error(`Cannot revert layout id ${id} because it does not exist`);
      }
      return await storage.put({
        ...layout,
        working: undefined,
      });
    });
    this.notifyChangeListeners({ updatedLayout: result });
    return result;
  }

  // FIXME remote layout support
  // /** Ensures at most one sync operation is in progress at a time */
  // private currentSync?: Promise<ReadonlyMap<string, ConflictInfo>>;

  // /**
  //  * Attempt to synchronize the local cache with remote storage. At minimum this incurs a fetch of
  //  * the cached and remote layout lists; it may also involve modifications to the cache, remote
  //  * storage, or both.
  //  * @returns Any conflicts that arose during the sync.
  //  */
  // async syncWithRemote(): Promise<ReadonlyMap<string, ConflictInfo>> {
  //   if (this.currentSync) {
  //     return await this.currentSync;
  //   }
  //   try {
  //     this.currentSync = this.syncWithRemoteImpl();
  //     this.latestConflictsByCacheId = await this.currentSync;
  //     this.notifyChangeListeners();
  //     return this.latestConflictsByCacheId;
  //   } finally {
  //     this.currentSync = undefined;
  //   }
  // }
}
