// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { PanelsState } from "@foxglove/studio-base/context/CurrentLayoutContext/actions";
import { ISO8601Timestamp, LayoutID } from "@foxglove/studio-base/services/ILayoutStorage";

/**
 * A panel layout stored on a remote server.
 */
export type RemoteLayout = {
  id: LayoutID;
  name: string;
  permission: "creator_write" | "org_read" | "org_write";
  data: PanelsState;
};

export interface IRemoteLayoutStorage {
  /**
   * A namespace corresponding to the logged-in user. Used by the LayoutManager to organize cached
   * layouts on disk.
   */
  readonly namespace: string;

  getLayouts: () => Promise<readonly RemoteLayout[]>;

  getLayout: (id: LayoutID) => Promise<RemoteLayout | undefined>;

  saveNewLayout: (params: {
    name: string;
    data: PanelsState;
    permission: "creator_write" | "org_read" | "org_write";
    savedAt: ISO8601Timestamp;
  }) => Promise<RemoteLayout>;

  updateLayout: (params: {
    id: LayoutID;
    name?: string;
    data?: PanelsState;
    permission?: "creator_write" | "org_read" | "org_write";
    savedAt: ISO8601Timestamp;
  }) => Promise<RemoteLayout>;

  deleteLayout: (id: LayoutID) => Promise<void>;
}
