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
  LayoutChangeListener,
} from "@foxglove/studio-base/services/ILayoutManager";
import {
  ILayoutStorage,
  Layout,
  LayoutID,
  layoutIsShared,
  LayoutPermission,
  layoutPermissionIsShared,
} from "@foxglove/studio-base/services/ILayoutStorage";
import {
  IRemoteLayoutStorage,
  RemoteLayout,
} from "@foxglove/studio-base/services/IRemoteLayoutStorage";

const log = Logger.getLogger(__filename);

/**
 * A wrapper around ILayoutStorage for a particular namespace.
 */
class NamespacedLayoutStorage {
  private migration?: Promise<void>;
  constructor(
    private storage: ILayoutStorage,
    private namespace: string,
    { migrateLocalLayouts }: { migrateLocalLayouts: boolean },
  ) {
    if (migrateLocalLayouts) {
      this.migration = storage.migrateLocalLayouts?.(namespace).catch((error) => {
        log.error("Migration failed:", error);
      });
    }
  }

  async list(): Promise<readonly Layout[]> {
    await this.migration;
    return await this.storage.list(this.namespace);
  }
  async get(id: LayoutID): Promise<Layout | undefined> {
    await this.migration;
    return await this.storage.get(this.namespace, id);
  }
  async put(layout: Layout): Promise<Layout> {
    await this.migration;
    return await this.storage.put(this.namespace, layout);
  }
  async delete(id: LayoutID): Promise<void> {
    await this.migration;
    await this.storage.delete(this.namespace, id);
  }
}

export default class LayoutManager implements ILayoutManager {
  static readonly LOCAL_STORAGE_NAMESPACE = "local";

  /**
   * All access to storage is wrapped in a mutex to prevent multi-step operations (such as reading
   * and then writing a single layout, or writing one and deleting another) from getting
   * interleaved.
   */
  private local: MutexLocked<NamespacedLayoutStorage>;
  private remote: IRemoteLayoutStorage | undefined;

  readonly supportsSharing: boolean;

  private changeListeners = new Set<LayoutChangeListener>();

  constructor({
    local,
    remote,
  }: {
    local: ILayoutStorage;
    remote: IRemoteLayoutStorage | undefined;
  }) {
    this.local = new MutexLocked(
      new NamespacedLayoutStorage(local, LayoutManager.LOCAL_STORAGE_NAMESPACE, {
        migrateLocalLayouts: true,
      }),
    );
    this.remote = remote;
    this.supportsSharing = remote != undefined;
  }

  addLayoutsChangedListener(listener: LayoutChangeListener): void {
    this.changeListeners.add(listener);
  }
  removeLayoutsChangedListener(listener: LayoutChangeListener): void {
    this.changeListeners.delete(listener);
  }
  private notifyChangeListeners(event: { updatedLayout: Layout | undefined }) {
    queueMicrotask(() => {
      for (const listener of [...this.changeListeners]) {
        listener(event);
      }
    });
  }

  async getLayouts(): Promise<readonly Layout[]> {
    return await this.local.runExclusive(async (local) => await local.list());
  }

  async getLayout(id: LayoutID): Promise<Layout | undefined> {
    return await this.local.runExclusive(async (local) => await local.get(id));
  }

  async saveNewLayout({
    name,
    data,
    permission,
  }: {
    name: string;
    data: PanelsState;
    permission: LayoutPermission;
  }): Promise<Layout> {
    if (layoutPermissionIsShared(permission)) {
      if (!this.remote) {
        throw new Error("Shared layouts are not supported without remote layout storage");
      }
      const newLayout = await this.remote.saveNewLayout({
        name,
        data,
        permission,
        savedAt: new Date().toISOString() as ISO8601Timestamp,
      });
      const result = await this.local.runExclusive(
        async (local) =>
          await local.put({
            id: newLayout.id,
            name: newLayout.name,
            permission: newLayout.permission,
            baseline: { savedAt: newLayout.savedAt, data: newLayout.data },
            working: undefined,
          }),
      );
      this.notifyChangeListeners({ updatedLayout: undefined });
      return result;
    }

    const newLayout = await this.local.runExclusive(
      async (local) =>
        await local.put({
          id: uuidv4() as LayoutID,
          name,
          permission,
          working: undefined,
          baseline: { data, savedAt: new Date().toISOString() as ISO8601Timestamp },
        }),
    );
    this.notifyChangeListeners({ updatedLayout: newLayout });
    return newLayout;
  }

  // FIXME: ok to remove permission?
  async updateLayout({
    id,
    name,
    data,
  }: {
    id: LayoutID;
    name: string | undefined;
    data: PanelsState | undefined;
  }): Promise<Layout> {
    const now = new Date().toISOString() as ISO8601Timestamp;
    const localLayout = await this.local.runExclusive(async (local) => await local.get(id));
    if (!localLayout) {
      throw new Error(`Cannot update layout ${id} because it does not exist`);
    }

    // Renames of shared layouts go directly to the server
    if (name != undefined && layoutIsShared(localLayout)) {
      if (!this.remote) {
        throw new Error("Shared layouts are not supported without remote layout storage");
      }
      const updatedBaseline = await this.remote.updateLayout({ id, name, savedAt: now });
      const result = await this.local.runExclusive(
        async (local) =>
          await local.put({
            ...localLayout,
            name: updatedBaseline.name,
            baseline: { data: updatedBaseline.data, savedAt: updatedBaseline.savedAt },
            working: data != undefined ? { data, savedAt: now } : localLayout.working,
          }),
      );
      this.notifyChangeListeners({ updatedLayout: result });
      return result;
    } else {
      const result = await this.local.runExclusive(
        async (local) =>
          await local.put({
            ...localLayout,
            name: name ?? localLayout.name,
            working: data != undefined ? { data, savedAt: now } : localLayout.working,
          }),
      );
      this.notifyChangeListeners({ updatedLayout: result });
      return result;
    }
  }

  async deleteLayout({ id }: { id: LayoutID }): Promise<void> {
    const localLayout = await this.local.runExclusive(async (local) => await local.get(id));
    if (!localLayout) {
      throw new Error(`Cannot update layout ${id} because it does not exist`);
    }
    if (layoutIsShared(localLayout)) {
      if (!this.remote) {
        throw new Error("Shared layouts are not supported without remote layout storage");
      }
      await this.remote.deleteLayout(id);
    }
    await this.local.runExclusive(async (local) => await local.delete(id));
    this.notifyChangeListeners({ updatedLayout: undefined });
  }

  async overwriteLayout({ id }: { id: LayoutID }): Promise<Layout> {
    const localLayout = await this.local.runExclusive(async (local) => await local.get(id));
    if (!localLayout) {
      throw new Error(`Cannot overwrite layout ${id} because it does not exist`);
    }
    if (layoutIsShared(localLayout)) {
      if (!this.remote) {
        throw new Error("Shared layouts are not supported without remote layout storage");
      }
      const updatedBaseline = await this.remote.updateLayout({
        id,
        data: localLayout.working?.data ?? localLayout.baseline.data,
        savedAt: new Date().toISOString() as ISO8601Timestamp,
      });
      const result = await this.local.runExclusive(
        async (local) =>
          await local.put({
            ...localLayout,
            baseline: { data: updatedBaseline.data, savedAt: updatedBaseline.savedAt },
            working: undefined,
          }),
      );
      this.notifyChangeListeners({ updatedLayout: result });
      return result;
    } else {
      const result = await this.local.runExclusive(
        async (local) =>
          await local.put({
            ...localLayout,
            baseline: localLayout.working ?? localLayout.baseline,
            working: undefined,
          }),
      );
      this.notifyChangeListeners({ updatedLayout: result });
      return result;
    }
  }

  async revertLayout({ id }: { id: LayoutID }): Promise<Layout> {
    const result = await this.local.runExclusive(async (local) => {
      const layout = await local.get(id);
      if (!layout) {
        throw new Error(`Cannot revert layout id ${id} because it does not exist`);
      }
      return await local.put({
        ...layout,
        working: undefined,
      });
    });
    this.notifyChangeListeners({ updatedLayout: result });
    return result;
  }

  /** Ensures at most one sync operation is in progress at a time */
  private currentSync?: Promise<void>;

  /**
   * Attempt to synchronize the local cache with remote storage. At minimum this incurs a fetch of
   * the cached and remote layout lists; it may also involve modifications to the cache, remote
   * storage, or both.
   * @returns Any conflicts that arose during the sync.
   */
  async syncWithRemote(): Promise<void> {
    if (this.currentSync) {
      return await this.currentSync;
    }
    try {
      this.currentSync = this.syncWithRemoteImpl();
      this.notifyChangeListeners({ updatedLayout: undefined });
    } finally {
      this.currentSync = undefined;
    }
  }

  private async syncWithRemoteImpl(): Promise<void> {
    if (!this.remote) {
      return;
    }
    const [cachedLayoutsById, remoteLayoutsById] = await Promise.all([
      this.local.runExclusive(
        async (local) =>
          await local
            .list()
            .then(
              (layouts): ReadonlyMap<string, Layout> =>
                new Map(layouts.map((layout) => [layout.id, layout])),
            ),
      ),
      this.remote
        .getLayouts()
        .then(
          (layouts): ReadonlyMap<string, RemoteLayout> =>
            new Map(layouts.map((layout) => [layout.id, layout])),
        ),
    ]);

    //FIXME
  }
}
