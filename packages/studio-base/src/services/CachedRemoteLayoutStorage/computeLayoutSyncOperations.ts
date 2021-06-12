// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { LayoutID } from "@foxglove/studio-base/services/LayoutStorage";
import { LocalLayout } from "@foxglove/studio-base/services/LocalLayoutStorage";
import { RemoteLayoutMetadata } from "@foxglove/studio-base/services/RemoteLayoutStorage";

export type ConflictType =
  | "local-delete-remote-update"
  | "local-update-remote-delete"
  | "both-update";

type LocalLayoutWithState = LocalLayout & { state: NonNullable<LocalLayout["state"]> };

export type SyncOperation =
  | { type: "add-to-cache"; remoteLayout: RemoteLayoutMetadata }
  | { type: "delete-local"; localLayout: LocalLayout }
  | { type: "delete-remote"; localLayout: LocalLayout; remoteLayout: RemoteLayoutMetadata }
  | { type: "upload-new"; localLayout: LocalLayoutWithState }
  | { type: "upload-updated"; localLayout: LocalLayout; remoteLayout: RemoteLayoutMetadata }
  | { type: "update-cached-metadata"; localLayout: LocalLayout; remoteLayout: RemoteLayoutMetadata }
  | {
      type: "conflict";
      localLayout: LocalLayout;
      conflictType: ConflictType;
    };

export default function computeLayoutSyncOperations(
  localLayoutsById: ReadonlyMap<string, LocalLayout>,
  remoteLayoutsById: ReadonlyMap<LayoutID, RemoteLayoutMetadata>,
): SyncOperation[] {
  const ops: SyncOperation[] = [];
  const newLayoutsToCache = new Map(remoteLayoutsById);

  for (const localLayout of localLayoutsById.values()) {
    // If the layout was created locally, upload it
    if (localLayout.serverMetadata == undefined) {
      if (localLayout.state == undefined) {
        // Nothing to upload, might as well delete.
        ops.push({ type: "delete-local", localLayout });
      } else {
        ops.push({
          type: "upload-new",
          // Convince TS that state is present
          localLayout: { ...localLayout, state: localLayout.state },
        });
      }
      continue;
    }
    newLayoutsToCache.delete(localLayout.serverMetadata.id);

    //FIXME: ensure that localId matches remote id?

    // If we know the layout's server id, but it no longer exists on the server, delete it
    const remoteLayout = remoteLayoutsById.get(localLayout.serverMetadata.id);
    if (remoteLayout == undefined) {
      if (localLayout.locallyModified === true) {
        ops.push({ type: "conflict", localLayout, conflictType: "local-update-remote-delete" });
      } else {
        ops.push({ type: "delete-local", localLayout });
      }
      continue;
    }

    const cachedUpdatedAt = Date.parse(localLayout.serverMetadata.updatedAt);
    const serverUpdatedAt = Date.parse(remoteLayout.updatedAt);

    if (serverUpdatedAt > cachedUpdatedAt) {
      if (localLayout.locallyModified === true || localLayout.locallyDeleted === true) {
        ops.push({
          type: "conflict",
          localLayout,
          conflictType:
            localLayout.locallyDeleted === true ? "local-delete-remote-update" : "both-update",
        });
      } else {
        ops.push({ type: "update-cached-metadata", localLayout, remoteLayout });
      }
    } else if (localLayout.locallyDeleted === true) {
      ops.push({ type: "delete-remote", localLayout, remoteLayout });
    } else if (localLayout.locallyModified === true) {
      ops.push({ type: "upload-updated", localLayout, remoteLayout });
    }
  }

  for (const remoteLayout of newLayoutsToCache.values()) {
    ops.push({ type: "add-to-cache", remoteLayout });
  }

  return ops;
}
