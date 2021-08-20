// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { MutexLocked } from "@foxglove/den/async";
import Logger from "@foxglove/log";
import { PanelsState } from "@foxglove/studio-base/context/CurrentLayoutContext/actions";
import { ILayoutManager, DisplayedLayout } from "@foxglove/studio-base/services/ILayoutManager";
import { ILayoutStorage, LayoutID } from "@foxglove/studio-base/services/ILayoutStorage";

const log = Logger.getLogger(__filename);

function keyById<T extends { id: unknown }>(items: readonly T[]): Map<T["id"], T> {
  return new Map(items.map((item) => [item.id, item]));
}

export default class LayoutManager implements ILayoutManager {
  /**
   * All access to storage is wrapped in a mutex to prevent multi-step operations (such as reading
   * and then writing a single layout, or writing one and deleting another) from getting
   * interleaved.
   */
  private storage: MutexLocked<{
    /** Storage for the user's edited versions of layouts */
    workingStorage: ILayoutStorage;
    /** Storage for pristine unedited copies of layouts */
    //FIXME: periodically populated from remote server?
    baselineStorage: ILayoutStorage;
  }>;

  // FIXME remote layout support
  // private remoteStorage: IRemoteLayoutStorage;
  // private latestConflictsByCacheId: ReadonlyMap<string, ConflictInfo> = new Map();

  readonly supportsSharing = false; // FIXME remote layout support

  private changeListeners = new Set<() => void>();

  constructor({
    workingStorage,
    baselineStorage,
  }: {
    workingStorage: ILayoutStorage;
    baselineStorage: ILayoutStorage;
  }) {
    // FIXME: continue wrapping in WriteThrough layer?
    this.storage = new MutexLocked({ workingStorage, baselineStorage });
  }

  addLayoutsChangedListener(listener: () => void): void {
    this.changeListeners.add(listener);
  }
  removeLayoutsChangedListener(listener: () => void): void {
    this.changeListeners.delete(listener);
  }
  private notifyChangeListeners() {
    queueMicrotask(() => {
      for (const listener of [...this.changeListeners]) {
        listener();
      }
    });
  }

  async getLayouts(): Promise<DisplayedLayout[]> {
    // FIXME: handle locally deleted layouts
    return await this.storage.runExclusive(async ({ workingStorage, baselineStorage }) => {
      const [workingLayoutsById, baselineLayoutsById] = await Promise.all([
        workingStorage.list().then(keyById),
        baselineStorage.list().then(keyById),
      ]);

      const workingIdsByBaselineId = new Map<LayoutID, LayoutID>();

      const results: DisplayedLayout[] = [];

      // Layouts with edits
      for (const working of workingLayoutsById.values()) {
        if (baselineLayoutsById.has(working.id)) {
          throw new Error(`Both a baseline and working layout exist with id: ${working.id}`);
        }
        if (working.baselineId == undefined) {
          log.warn(`Working copy of layout ${working.id} has no baseline`);
          continue;
        }
        results.push({ ...working, isModified: true });

        const duplicate = workingIdsByBaselineId.get(working.baselineId);
        if (duplicate != undefined) {
          log.error(
            `Two working layouts (${duplicate} and ${working.id}) have the same baseline id (${working.baselineId})`,
          );
        }
        workingIdsByBaselineId.set(working.baselineId, working.id);

        const deleted = baselineLayoutsById.delete(working.baselineId);
        if (!deleted) {
          // FIXME: is this expected when layouts are deleted from the server, how to clean up gracefully?
          log.warn(`Missing baseline ${working.baselineId} for working layout ${working.id}`);
        }
      }

      // Layouts with no edits, for which we only have baselines
      for (const baseline of baselineLayoutsById.values()) {
        if (workingLayoutsById.has(baseline.id)) {
          throw new Error(`Both a working and baseline layout exist with id: ${baseline.id}`);
        }
        results.push({ ...baseline, isModified: false });
      }

      return results;
    });
  }

  async getLayout(id: LayoutID): Promise<DisplayedLayout | undefined> {
    // FIXME: handle locally deleted layouts
    return await this.storage.runExclusive(async ({ workingStorage, baselineStorage }) => {
      const working = await workingStorage.get(id);
      if (working) {
        return { ...working, isModified: true };
      }
      const baseline = await baselineStorage.get(id);
      if (baseline) {
        return { ...baseline, isModified: false };
      }
      return undefined;
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
    const newMetadata = await this.storage.runExclusive(async ({ baselineStorage }) => {
      return await baselineStorage.create({ name, data, permission, baselineId: undefined });
    });
    this.notifyChangeListeners();
    return { ...newMetadata, isModified: false };
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
    //FIXME: should id creation be handled in the storage? if so we can't choose the id for workingStorage, so need a separate reference to baseline id
    const layout = await this.storage.runExclusive(async ({ workingStorage, baselineStorage }) => {
      // Update the working copy of the layout if it is already modified
      const working = await workingStorage.get(id);
      if (working) {
        return await workingStorage.put({
          ...working,
          name: name ?? working.name,
          data: data ?? working.data,
          permission: permission ?? working.permission,
        });
      }

      // If this is the first edit, create a working copy that points to the baseline
      const baseline = await baselineStorage.get(id);
      if (baseline) {
        return await workingStorage.create({
          name: name ?? baseline.name,
          data: data ?? baseline.data,
          permission: permission ?? baseline.permission,
          baselineId: baseline.id,
        });
      }

      throw new Error(`Layout ${id} is neither a working copy nor an existing baseline`);
    });
    this.notifyChangeListeners();
    return { ...layout, isModified: true };
  }

  async deleteLayout({ id }: { id: LayoutID }): Promise<void> {
    // FIXME: remote layouts: record tombstone and later delete on the server
    await this.storage.runExclusive(async ({ workingStorage, baselineStorage }) => {
      const working = await workingStorage.get(id);
      if (working) {
        await workingStorage.delete(id);
        if (working.baselineId != undefined) {
          await baselineStorage.delete(working.baselineId);
        } else {
          log.warn(`Cannot cascade delete of working layout ${id} because it has no baseline`);
        }
      } else {
        const baseline = await baselineStorage.get(id);
        if (baseline) {
          await baselineStorage.delete(id);
        } else {
          log.warn(`Cannot delete layout id ${id} because it does not exist`);
        }
      }
    });
    this.notifyChangeListeners();
  }

  async overwriteLayout({ id }: { id: LayoutID }): Promise<DisplayedLayout> {
    const result = await this.storage.runExclusive(async ({ workingStorage, baselineStorage }) => {
      const working = await workingStorage.get(id);
      if (!working) {
        throw new Error(`Cannot overwrite layout ${id} because it does not exist`);
      }
      if (!working.baselineId) {
        throw new Error(`Cannot overwrite layout ${id} because it has no baseline`);
      }
      const newBaseline = await baselineStorage.put({
        ...working,
        id: working.baselineId,
        baselineId: undefined,
      });
      await workingStorage.delete(id);
      return newBaseline;
    });
    this.notifyChangeListeners();
    return { ...result, isModified: true };
  }

  async revertLayout({ id }: { id: LayoutID }): Promise<DisplayedLayout> {
    const result = await this.storage.runExclusive(async ({ workingStorage, baselineStorage }) => {
      const working = await workingStorage.get(id);
      if (!working) {
        throw new Error(`Cannot revert layout ${id} because it does not exist`);
      }
      if (!working.baselineId) {
        throw new Error(`Cannot revert layout ${id} because it has no baseline`);
      }
      const baseline = await baselineStorage.get(working.baselineId);
      if (!baseline) {
        throw new Error(`Cannot revert layout ${id} because its baseline does not exist`);
      }
      await workingStorage.delete(id);
      return baseline;
    });
    this.notifyChangeListeners();
    return { ...result, isModified: true };
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
