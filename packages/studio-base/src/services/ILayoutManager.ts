// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { PanelsState } from "@foxglove/studio-base/context/CurrentLayoutContext/actions";
import { Layout, LayoutID } from "@foxglove/studio-base/services/ILayoutStorage";

// FIXME: better name?
export type DisplayedLayout = Layout & {
  /**
   * Indicates whether changes have been made to the user's copy of this layout that have yet to be
   * saved. Save the changes by calling ILayoutStorage.syncLayout().
   */
  isModified: boolean;
};

export interface ILayoutManager {
  /** Indicates whether permissions other than "creator_write" are supported. */
  readonly supportsSharing: boolean;

  addLayoutsChangedListener(listener: () => void): void;
  removeLayoutsChangedListener(listener: () => void): void;

  getLayouts(): Promise<DisplayedLayout[]>;

  getLayout(id: LayoutID): Promise<DisplayedLayout | undefined>;

  saveNewLayout(params: {
    name: string;
    data: PanelsState;
    permission: "creator_write" | "org_read" | "org_write";
  }): Promise<DisplayedLayout>;

  /**
   * Persist changes to the user's edited copy of this layout.
   *
   * @note If the layout has not been edited before, the returned layout's id may be different from
   * the input id.
   */
  updateLayout(params: {
    id: LayoutID;
    name?: string;
    data?: PanelsState;
    permission?: "creator_write" | "org_read" | "org_write";
  }): Promise<DisplayedLayout>;

  deleteLayout(params: { id: LayoutID; baselineId?: LayoutID }): Promise<void>;

  /** Save the local changes so they override the baseline. */
  overwriteLayout(params: { id: LayoutID }): Promise<DisplayedLayout>;

  /** Revert this layout to the baseline. */
  revertLayout(params: { id: LayoutID }): Promise<DisplayedLayout>;
}
