// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import useContextSelector from "@foxglove/studio-base/hooks/useContextSelector";
import { LinkedGlobalVariables } from "@foxglove/studio-base/panels/ThreeDimensionalViz/Interactions/useLinkedGlobalVariables";
import { PanelConfig, PlaybackConfig, UserNodes } from "@foxglove/studio-base/types/panels";
import createSelectableContext from "@foxglove/studio-base/util/createSelectableContext";

import {
  PanelsState,
  AddPanelPayload,
  ChangePanelLayoutPayload,
  ClosePanelPayload,
  CreateTabPanelPayload,
  DropPanelPayload,
  EndDragPayload,
  LoadLayoutPayload,
  MoveTabPayload,
  SaveConfigsPayload,
  SplitPanelPayload,
  StartDragPayload,
  SwapPanelPayload,
} from "./actions";

/**
 * Encapsulates the mosaic layout, user nodes, and playback settings (everything considered to be
 * part of a saved "layout") used by the current workspace.
 */
export interface CurrentLayout {
  state: PanelsState;
  actions: {
    /**
     * Returns the current state - useful for click handlers and callbacks that read the state
     * asynchronously and don't want to update every time the state changes.
     */
    getCurrentLayout: () => PanelsState;

    savePanelConfigs: (payload: SaveConfigsPayload) => void;
    updatePanelConfigs: (panelType: string, updater: (config: PanelConfig) => PanelConfig) => void;
    createTabPanel: (payload: CreateTabPanelPayload) => void;
    changePanelLayout: (payload: ChangePanelLayoutPayload) => void;
    loadLayout: (payload: LoadLayoutPayload) => void;
    overwriteGlobalVariables: (payload: { [key: string]: unknown }) => void;
    setGlobalVariables: (payload: { [key: string]: unknown }) => void;
    setUserNodes: (payload: UserNodes) => void;
    setLinkedGlobalVariables: (payload: LinkedGlobalVariables) => void;
    setPlaybackConfig: (payload: Partial<PlaybackConfig>) => void;
    closePanel: (payload: ClosePanelPayload) => void;
    splitPanel: (payload: SplitPanelPayload) => void;
    swapPanel: (payload: SwapPanelPayload) => void;
    moveTab: (payload: MoveTabPayload) => void;
    addPanel: (payload: AddPanelPayload) => void;
    dropPanel: (payload: DropPanelPayload) => void;
    startDrag: (payload: StartDragPayload) => void;
    endDrag: (payload: EndDragPayload) => void;
  };
}

const CurrentLayoutContext = createSelectableContext<CurrentLayout>();

export function useCurrentLayoutActions(): CurrentLayout["actions"] {
  return useContextSelector(CurrentLayoutContext, ({ actions }) => actions);
}
export function useCurrentLayoutSelector<T>(selector: (panelsState: PanelsState) => T): T {
  return useContextSelector(CurrentLayoutContext, ({ state }) => selector(state));
}

export default CurrentLayoutContext;
