// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { PanelsState } from "@foxglove/studio-base/context/CurrentLayoutContext/actions";

// We use "brand" tags to prevent confusion between string types with distinct meanings
// https://github.com/microsoft/TypeScript/issues/4895
export type LayoutID = string & { __brand: "LayoutID" };
export type ISO8601Timestamp = string & { __brand: "ISO8601Timestamp" };

export type Layout = {
  id: LayoutID;
  name: string;
  data: PanelsState;

  createdAt: ISO8601Timestamp | undefined;
  updatedAt: ISO8601Timestamp | undefined;
  permission: "creator_write" | "org_read" | "org_write";

  /**
   * Indicates baseline from which this layout was forked, if applicable.
   */
  baselineId: LayoutID | undefined;
  // FIXME: also store updatedAt of baseline when it was forked, so we can warn about newer changes when overwriting?
};

export interface ILayoutStorage {
  list(): Promise<readonly Layout[]>;
  get(id: LayoutID): Promise<Layout | undefined>;
  create(layout: Pick<Layout, "name" | "data" | "permission" | "baselineId">): Promise<Layout>;
  put(layout: Layout): Promise<Layout>;
  delete(id: LayoutID): Promise<void>;
}
