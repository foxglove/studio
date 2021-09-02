// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import EventEmitter, { EventNames, EventListener } from "eventemitter3";
import { partition } from "lodash";
import { v4 as uuidv4 } from "uuid";

import { MutexLocked } from "@foxglove/den/async";
import Logger from "@foxglove/log";
import { PanelsState } from "@foxglove/studio-base/context/CurrentLayoutContext/actions";
import { ISO8601Timestamp } from "@foxglove/studio-base/services/ConsoleApi";
import {
  ILayoutManager,
  LayoutManagerEventTypes,
} from "@foxglove/studio-base/services/ILayoutManager";
import {
  ILayoutStorage,
  Layout,
  LayoutID,
  layoutIsShared,
  LayoutPermission,
  layoutPermissionIsShared,
} from "@foxglove/studio-base/services/ILayoutStorage";
import { IRemoteLayoutStorage } from "@foxglove/studio-base/services/IRemoteLayoutStorage";
import computeLayoutSyncOperations, {
  SyncOperation,
} from "@foxglove/studio-base/services/LayoutManager/computeLayoutSyncOperations";

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
  static readonly REMOTE_STORAGE_NAMESPACE_PREFIX = "remote-";

  /**
   * All access to storage is wrapped in a mutex to prevent multi-step operations (such as reading
   * and then writing a single layout, or writing one and deleting another) from getting
   * interleaved.
   */
  private local: MutexLocked<NamespacedLayoutStorage>;
  private remote: IRemoteLayoutStorage | undefined;

  readonly supportsSharing: boolean;

  private emitter = new EventEmitter<LayoutManagerEventTypes>();

  private activityCount = 0;

  /**
   * A decorator to emit activity events before and after an async operation so the UI can show that
   * the operation is in progress.
   */
  private static withActivity<Args extends unknown[], Ret>(
    _prototype: typeof LayoutManager.prototype,
    _propertyKey: string,
    descriptor: TypedPropertyDescriptor<(this: LayoutManager, ...args: Args) => Promise<Ret>>,
  ) {
    const method = descriptor.value!;
    descriptor.value = async function (...args) {
      try {
        this.activityCount++;
        this.emitter.emit("activitychange");
        return await method.apply(this, args);
      } finally {
        this.activityCount--;
        this.emitter.emit("activitychange");
      }
    };
  }

  // eslint-disable-next-line no-restricted-syntax
  get isActive(): boolean {
    return this.activityCount > 0;
  }

  constructor({
    local,
    remote,
  }: {
    local: ILayoutStorage;
    remote: IRemoteLayoutStorage | undefined;
  }) {
    this.local = new MutexLocked(
      new NamespacedLayoutStorage(
        local,
        remote
          ? LayoutManager.REMOTE_STORAGE_NAMESPACE_PREFIX + remote.namespace
          : LayoutManager.LOCAL_STORAGE_NAMESPACE,
        { migrateLocalLayouts: true },
      ),
    );
    this.remote = remote;
    this.supportsSharing = remote != undefined;
  }

  on<E extends EventNames<LayoutManagerEventTypes>>(
    name: E,
    listener: EventListener<LayoutManagerEventTypes, E>,
  ): void {
    this.emitter.on(name, listener);
  }
  off<E extends EventNames<LayoutManagerEventTypes>>(
    name: E,
    listener: EventListener<LayoutManagerEventTypes, E>,
  ): void {
    this.emitter.off(name, listener);
  }

  private notifyChangeListeners(event: { updatedLayout: Layout | undefined }) {
    queueMicrotask(() => this.emitter.emit("change", event));
  }

  async getLayouts(): Promise<readonly Layout[]> {
    return await this.local.runExclusive(async (local) => {
      const layouts = await local.list();
      return layouts.filter((layout) => layout.remote?.syncStatus !== "locally-deleted");
    });
  }

  async getLayout(id: LayoutID): Promise<Layout | undefined> {
    return await this.local.runExclusive(async (local) => {
      const layout = await local.get(id);
      return layout?.remote?.syncStatus === "locally-deleted" ? undefined : layout;
    });
  }

  @LayoutManager.withActivity
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
        id: uuidv4() as LayoutID,
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
            baseline: { data: newLayout.data, savedAt: newLayout.savedAt },
            working: undefined,
            remote: { syncStatus: "tracked", savedAt: newLayout.savedAt },
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
          baseline: { data, savedAt: new Date().toISOString() as ISO8601Timestamp },
          working: undefined,
          remote: this.remote ? { syncStatus: "new", savedAt: undefined } : undefined,
        }),
    );
    this.notifyChangeListeners({ updatedLayout: newLayout });
    return newLayout;
  }

  @LayoutManager.withActivity
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
            remote: { syncStatus: "tracked", savedAt: updatedBaseline.savedAt },
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

            // If the name is being changed, we will need to upload to the server
            remote:
              this.remote && name != undefined
                ? { syncStatus: "updated", savedAt: localLayout.remote?.savedAt }
                : localLayout.remote,
          }),
      );
      this.notifyChangeListeners({ updatedLayout: result });
      return result;
    }
  }

  @LayoutManager.withActivity
  async deleteLayout({ id }: { id: LayoutID }): Promise<void> {
    const localLayout = await this.local.runExclusive(async (local) => await local.get(id));
    if (!localLayout) {
      throw new Error(`Cannot update layout ${id} because it does not exist`);
    }
    if (layoutIsShared(localLayout)) {
      if (!this.remote) {
        throw new Error("Shared layouts are not supported without remote layout storage");
      }
      if (localLayout.remote?.syncStatus !== "remotely-deleted") {
        await this.remote.deleteLayout(id);
      }
    }
    await this.local.runExclusive(async (local) => {
      if (this.remote && !layoutIsShared(localLayout)) {
        await local.put({
          ...localLayout,
          working: {
            data: localLayout.working?.data ?? localLayout.baseline.data,
            savedAt: new Date().toISOString() as ISO8601Timestamp,
          },
          remote: { syncStatus: "locally-deleted", savedAt: localLayout.remote?.savedAt },
        });
      } else {
        // Don't have remote storage, or already deleted on remote
        await local.delete(id);
      }
    });
    this.notifyChangeListeners({ updatedLayout: undefined });
  }

  @LayoutManager.withActivity
  async overwriteLayout({ id }: { id: LayoutID }): Promise<Layout> {
    const localLayout = await this.local.runExclusive(async (local) => await local.get(id));
    if (!localLayout) {
      throw new Error(`Cannot overwrite layout ${id} because it does not exist`);
    }
    const now = new Date().toISOString() as ISO8601Timestamp;
    if (layoutIsShared(localLayout)) {
      if (!this.remote) {
        throw new Error("Shared layouts are not supported without remote layout storage");
      }
      const updatedBaseline = await this.remote.updateLayout({
        id,
        data: localLayout.working?.data ?? localLayout.baseline.data,
        savedAt: now,
      });
      const result = await this.local.runExclusive(
        async (local) =>
          await local.put({
            ...localLayout,
            baseline: { data: updatedBaseline.data, savedAt: updatedBaseline.savedAt },
            working: undefined,
            remote: { syncStatus: "tracked", savedAt: updatedBaseline.savedAt },
          }),
      );
      this.notifyChangeListeners({ updatedLayout: result });
      return result;
    } else {
      const result = await this.local.runExclusive(
        async (local) =>
          await local.put({
            ...localLayout,
            baseline: {
              data: localLayout.working?.data ?? localLayout.baseline.data,
              savedAt: now,
            },
            working: undefined,
            remote: this.remote
              ? { syncStatus: "updated", savedAt: localLayout.remote?.savedAt }
              : localLayout.remote,
          }),
      );
      this.notifyChangeListeners({ updatedLayout: result });
      return result;
    }
  }

  @LayoutManager.withActivity
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

  @LayoutManager.withActivity
  async makePersonalCopy({ id, name }: { id: LayoutID; name: string }): Promise<Layout> {
    const now = new Date().toISOString() as ISO8601Timestamp;
    const result = await this.local.runExclusive(async (local) => {
      const layout = await local.get(id);
      if (!layout) {
        throw new Error(`Cannot make a personal copy of layout id ${id} because it does not exist`);
      }
      const newLayout = await local.put({
        id: uuidv4() as LayoutID,
        name,
        permission: "creator_write",
        baseline: { data: layout.working?.data ?? layout.baseline.data, savedAt: now },
        working: undefined,
        remote: { syncStatus: "new", savedAt: now },
      });
      await local.put({ ...layout, working: undefined });
      return newLayout;
    });
    this.notifyChangeListeners({ updatedLayout: undefined });
    return result;
  }

  /** Ensures at most one sync operation is in progress at a time */
  private currentSync?: Promise<void>;

  /**
   * Attempt to synchronize the local cache with remote storage. At minimum this incurs a fetch of
   * the cached and remote layout lists; it may also involve modifications to the cache, remote
   * storage, or both.
   */
  @LayoutManager.withActivity
  async syncWithRemote(): Promise<void> {
    if (this.currentSync) {
      log.debug("Layout sync is already in progress");
      return await this.currentSync;
    }
    const start = performance.now();
    try {
      log.debug("Starting layout sync");
      this.currentSync = this.syncWithRemoteImpl();
      await this.currentSync;
      this.notifyChangeListeners({ updatedLayout: undefined });
    } finally {
      this.currentSync = undefined;
      log.debug(`Completed sync in ${((performance.now() - start) / 1000).toFixed(2)}s`);
    }
  }

  private async syncWithRemoteImpl(): Promise<void> {
    if (!this.remote) {
      return;
    }

    const [localLayouts, remoteLayouts] = await Promise.all([
      this.local.runExclusive(async (local) => await local.list()),
      this.remote.getLayouts(),
    ]);

    const syncOperations = computeLayoutSyncOperations(localLayouts, remoteLayouts);
    const [localOps, remoteOps] = partition(
      syncOperations,
      (op): op is typeof op & { local: true } => op.local,
    );
    await Promise.all([
      this.performLocalSyncOperations(localOps),
      this.performRemoteSyncOperations(remoteOps),
    ]);
  }

  private async performLocalSyncOperations(
    operations: readonly (SyncOperation & { local: true })[],
  ): Promise<void> {
    await this.local.runExclusive(async (local) => {
      for (const operation of operations) {
        switch (operation.type) {
          case "mark-deleted": {
            const { localLayout } = operation;
            log.debug(`Marking layout as remotely deleted: ${localLayout.id}`);
            await local.put({
              ...localLayout,
              remote: { syncStatus: "remotely-deleted", savedAt: undefined },
            });
            break;
          }

          case "delete-local":
            await local.delete(operation.localLayout.id);
            break;

          case "add-to-cache": {
            const { remoteLayout } = operation;
            log.debug(`Adding layout to cache: ${remoteLayout.id}`);
            await local.put({
              id: remoteLayout.id,
              name: remoteLayout.name,
              permission: remoteLayout.permission,
              baseline: { data: remoteLayout.data, savedAt: remoteLayout.savedAt },
              working: undefined,
              remote: { syncStatus: "tracked", savedAt: remoteLayout.savedAt },
            });
            break;
          }

          case "update-baseline": {
            const { localLayout, remoteLayout } = operation;
            log.debug(`Updating baseline for ${localLayout.id}`);
            await local.put({
              id: remoteLayout.id,
              name: remoteLayout.name,
              permission: remoteLayout.permission,
              baseline: { data: remoteLayout.data, savedAt: remoteLayout.savedAt },
              working: localLayout.working,
              remote: { syncStatus: localLayout.remote.syncStatus, savedAt: remoteLayout.savedAt },
            });
            break;
          }
        }
      }
    });
  }

  private async performRemoteSyncOperations(
    operations: readonly (SyncOperation & { local: false })[],
  ): Promise<void> {
    if (!this.remote) {
      return;
    }

    // Any necessary local cleanups are performed all at once after the server operations, so the
    // server ops can be done without blocking other local sync operations.
    const cleanups: ((local: NamespacedLayoutStorage) => void)[] = [];

    for (const operation of operations) {
      switch (operation.type) {
        case "delete-remote": {
          const { localLayout } = operation;
          log.debug(`Deleting remote layout ${localLayout.id}`);
          if (!(await this.remote.deleteLayout(localLayout.id))) {
            log.warn(`Deleting layout ${localLayout.id} which was not present in remote storage`);
          }
          cleanups.push(async (local) => await local.delete(localLayout.id));
          break;
        }

        case "upload-new": {
          const { localLayout } = operation;
          log.debug(`Uploading new layout ${localLayout.id}`);
          const newBaseline = await this.remote.saveNewLayout({
            id: localLayout.id,
            name: localLayout.name,
            data: localLayout.baseline.data,
            permission: localLayout.permission,
            savedAt: localLayout.baseline.savedAt ?? (new Date().toISOString() as ISO8601Timestamp),
          });
          cleanups.push(
            async (local) =>
              await local.put({
                ...localLayout,
                baseline: { ...localLayout.baseline, savedAt: newBaseline.savedAt },
                remote: { syncStatus: "tracked", savedAt: newBaseline.savedAt },
              }),
          );
          break;
        }

        //FIXME: ensure we handle renames properly
        case "upload-updated": {
          const { localLayout } = operation;
          log.debug(`Uploading updated layout ${localLayout.id}`);
          const newBaseline = await this.remote.updateLayout({
            id: localLayout.id,
            name: localLayout.name,
            data: localLayout.baseline.data,
            savedAt: localLayout.baseline.savedAt ?? (new Date().toISOString() as ISO8601Timestamp),
          });
          cleanups.push(
            async (local) =>
              await local.put({
                ...localLayout,
                baseline: { ...localLayout.baseline, savedAt: newBaseline.savedAt },
                remote: { syncStatus: "tracked", savedAt: newBaseline.savedAt },
              }),
          );
          break;
        }
      }
    }

    await this.local.runExclusive(async (local) => {
      for (const cleanup of cleanups) {
        cleanup(local);
      }
    });
  }
}
