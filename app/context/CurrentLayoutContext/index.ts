// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { createContext, useContext } from "react";

import { LinkedGlobalVariables } from "@foxglove/studio-base/panels/ThreeDimensionalViz/Interactions/useLinkedGlobalVariables";
import {
  ChangePanelLayoutPayload,
  SaveConfigsPayload,
  CreateTabPanelPayload,
  LoadLayoutPayload,
  PanelConfig,
  PlaybackConfig,
  UserNodes,
} from "@foxglove/studio-base/types/panels";

import {
  PanelsState,
  ClosePanelPayload,
  SplitPanelPayload,
  SwapPanelPayload,
  MoveTabPayload,
  AddPanelPayload,
  DropPanelPayload,
  StartDragPayload,
  EndDragPayload,
} from "./actions";

/**
 * Encapsulates the mosaic layout, user nodes, and playback settings (everything considered to be
 * part of a saved "layout") used by the current workspace.
 */
export interface CurrentLayout {
  state: PanelsState;

  savePanelConfigs(payload: SaveConfigsPayload): void;
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
