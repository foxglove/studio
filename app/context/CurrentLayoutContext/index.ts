// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useCallback } from "react";
import { getLeaves } from "react-mosaic-component";

import useContextSelector from "@foxglove/studio-base/hooks/useContextSelector";
import useShallowMemo from "@foxglove/studio-base/hooks/useShallowMemo";
import { LinkedGlobalVariables } from "@foxglove/studio-base/panels/ThreeDimensionalViz/Interactions/useLinkedGlobalVariables";
import toggleSelectedPanel from "@foxglove/studio-base/providers/CurrentLayoutProvider/toggleSelectedPanel";
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

  /**
   * We use the same mosaicId for all mosaics (at the top level and within tabs) to support
   * dragging and dropping between them.
   */
  mosaicId: string;

  selectedPanelIds: readonly string[];
  getSelectedPanelIds: () => readonly string[];
  setSelectedPanelIds: (
    _: readonly string[] | ((prevState: readonly string[]) => string[]),
  ) => void;

  actions: {
    /**
     * Returns the current state - useful for click handlers and callbacks that read the state
     * asynchronously and don't want to update every time the state changes.
     */
    getCurrentLayout: () => PanelsState;

    undoLayoutChange: () => void;
    redoLayoutChange: () => void;

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

export function usePanelMosaicId(): string {
  return useContextSelector(CurrentLayoutContext, ({ mosaicId }) => mosaicId);
}
export function useCurrentLayoutActions(): CurrentLayout["actions"] {
  return useContextSelector(CurrentLayoutContext, ({ actions }) => actions);
}
export function useCurrentLayoutSelector<T>(selector: (panelsState: PanelsState) => T): T {
  return useContextSelector(CurrentLayoutContext, ({ state }) => selector(state));
}
export function useSelectedPanels(): {
  getSelectedPanelIds: () => readonly string[];
  selectedPanelIds: readonly string[];
  setSelectedPanelIds: (
    _: readonly string[] | ((prevState: readonly string[]) => string[]),
  ) => void;
  selectAllPanels: () => void;
  togglePanelSelected: (panelId: string, containingTabId: string | undefined) => void;
} {
  const selectedPanelIds = useContextSelector(
    CurrentLayoutContext,
    (value) => value.selectedPanelIds,
  );
  const setSelectedPanelIds = useContextSelector(
    CurrentLayoutContext,
    (value) => value.setSelectedPanelIds,
  );
  const getSelectedPanelIds = useContextSelector(
    CurrentLayoutContext,
    (value) => value.getSelectedPanelIds,
  );
  const { getCurrentLayout } = useCurrentLayoutActions();

  const selectAllPanels = useCallback(() => {
    // eslint-disable-next-line no-restricted-syntax
    const panelIds = getLeaves(getCurrentLayout().layout ?? null);
    setSelectedPanelIds(panelIds);
  }, [getCurrentLayout, setSelectedPanelIds]);

  const togglePanelSelected = useCallback(
    (panelId: string, containingTabId: string | undefined) => {
      setSelectedPanelIds((selectedIds) =>
        toggleSelectedPanel(panelId, containingTabId, getCurrentLayout().configById, selectedIds),
      );
    },
    [setSelectedPanelIds, getCurrentLayout],
  );

  return useShallowMemo({
    getSelectedPanelIds,
    selectedPanelIds,
    setSelectedPanelIds,
    selectAllPanels,
    togglePanelSelected,
  });
}

export default CurrentLayoutContext;
