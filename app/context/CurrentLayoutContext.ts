// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { createContext, useContext } from "react";
import { MosaicNode, MosaicPath } from "react-mosaic-component";

import { LinkedGlobalVariables } from "@foxglove/studio-base/panels/ThreeDimensionalViz/Interactions/useLinkedGlobalVariables";
import { PanelsState } from "@foxglove/studio-base/reducers/panels";
import { TabLocation } from "@foxglove/studio-base/types/layouts";
import {
  MosaicDropTargetPosition,
  PanelConfig,
  PlaybackConfig,
  SavedProps,
  UserNodes,
} from "@foxglove/studio-base/types/panels";

export type ConfigsPayload = {
  id: string;
  config: PanelConfig;
  defaultConfig?: PanelConfig;
};
export type ChangePanelLayoutPayload = {
  layout?: MosaicNode<string>;
  trimSavedProps?: boolean;
};
export type SaveConfigsPayload = {
  configs: ConfigsPayload[];
};

export type UpdatePanelConfigsPayload = {
  panelType: string;
  perPanelFunc: <Config>(arg0: Config) => Config;
};

export type CreateTabPanelPayload = {
  idToReplace?: string;
  layout: MosaicNode<string>;
  idsToRemove: string[];
  singleTab: boolean;
};

export type LoadLayoutPayload = Partial<Omit<PanelsState, "id" | "name">>;

export type ClosePanelPayload = {
  tabId?: string;
  root: MosaicNode<string>;
  path: MosaicPath;
};
export type SplitPanelPayload = {
  tabId?: string;
  id: string;
  direction: "row" | "column";
  root: MosaicNode<string>;
  path: MosaicPath;
  config: PanelConfig;
};
export type SwapPanelPayload = {
  tabId?: string;
  originalId: string;
  type: string;
  root: MosaicNode<string>;
  path: MosaicPath;
  config: PanelConfig;
  relatedConfigs?: SavedProps;
};
export type MoveTabPayload = { source: TabLocation; target: TabLocation };
export type AddPanelPayload = {
  /** id must be formatted as returned by `getPanelIdForType`. This is required as an argument
   * rather than automatically generated because the caller may want to use the new id for
   * something, such as selecting the newly added panel. */
  id: string;
  layout?: MosaicNode<string>;
  tabId?: string;
  config?: PanelConfig;
  relatedConfigs?: SavedProps;
};
export type DropPanelPayload = {
  newPanelType: string;
  destinationPath?: MosaicPath;
  position?: "top" | "bottom" | "left" | "right";
  tabId?: string;
  config?: PanelConfig;
  relatedConfigs?: SavedProps;
};
export type StartDragPayload = {
  path: MosaicPath;
  sourceTabId?: string;
};
export type EndDragPayload = {
  originalLayout: MosaicNode<string>;
  originalSavedProps: SavedProps;
  panelId: string;
  sourceTabId?: string;
  targetTabId?: string;
  position?: MosaicDropTargetPosition;
  destinationPath?: MosaicPath;
  ownPath: MosaicPath;
};

/**
 * Encapsulates the mosaic layout, user nodes, and playback settings (everything considered to be
 * part of a saved "layout") used by the current workspace.
 */
export interface CurrentLayout {
  layout: PanelsState;

  savePanelConfigs(configs: { [id: string]: Partial<PanelConfig> }): void;
  updatePanelConfigs(panelType: string, updater: (config: PanelConfig) => PanelConfig): void;
  createTabPanel(payload: CreateTabPanelPayload): void;
  changePanelLayout(payload: ChangePanelLayoutPayload): void;
  loadLayout(payload: LoadLayoutPayload): void;
  overwriteGlobalVariables(payload: { [key: string]: unknown }): void;
  setGlobalVariables(payload: { [key: string]: unknown }): void;
  setUserNodes(payload: UserNodes): void;
  setLinkedGlobalVariables(payload: LinkedGlobalVariables): void;
  setPlaybackConfig(payload: Partial<PlaybackConfig>): void;
  closePanel(payload: ClosePanelPayload): void;
  splitPanel(payload: SplitPanelPayload): void;
  swapPanel(payload: SwapPanelPayload): void;
  moveTab(payload: MoveTabPayload): void;
  addPanel(payload: AddPanelPayload): void;
  dropPanel(payload: DropPanelPayload): void;
  startDrag(payload: StartDragPayload): void;
  endDrag(payload: EndDragPayload): void;
}

const CurrentLayoutContext = createContext<CurrentLayout | undefined>(undefined);

export function useCurrentLayout(): CurrentLayout {
  const ctx = useContext(CurrentLayoutContext);
  if (ctx === undefined) {
    throw new Error("A LayoutStorage provider is required to useCurrentLayout");
  }
  return ctx;
}

export default CurrentLayoutContext;
