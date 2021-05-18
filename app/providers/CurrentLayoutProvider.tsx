// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
import { pick } from "lodash";
import { useCallback, useState } from "react";
import { getLeaves, MosaicNode } from "react-mosaic-component";

import CurrentLayoutContext, {
  AddPanelPayload,
  ChangePanelLayoutPayload,
  ClosePanelPayload,
  CreateTabPanelPayload,
  CurrentLayout,
  DropPanelPayload,
  EndDragPayload,
  LoadLayoutPayload,
  MoveTabPayload,
  SplitPanelPayload,
  StartDragPayload,
  SwapPanelPayload,
} from "@foxglove/studio-base/context/CurrentLayoutContext";
import useShallowMemo from "@foxglove/studio-base/hooks/useShallowMemo";
import { LinkedGlobalVariables } from "@foxglove/studio-base/panels/ThreeDimensionalViz/Interactions/useLinkedGlobalVariables";
import { defaultPlaybackConfig, PanelsState } from "@foxglove/studio-base/reducers/panels";
import {
  PanelConfig,
  PlaybackConfig,
  SavedProps,
  UserNodes,
} from "@foxglove/studio-base/types/panels";
import { TAB_PANEL_TYPE } from "@foxglove/studio-base/util/globalConstants";
import { getPanelIdsInsideTabPanels, getPanelTypeFromId } from "@foxglove/studio-base/util/layout";

function trimUnusedSavedProps(layout?: MosaicNode<string>, savedProps: SavedProps): SavedProps {
  // eslint-disable-next-line no-restricted-syntax
  const panelIds = getLeaves(layout ?? null);
  const panelIdsInsideTabPanels = getPanelIdsInsideTabPanels(panelIds, savedProps);
  return pick(savedProps, [...panelIdsInsideTabPanels, ...panelIds]);
}

export default function CurrentLayoutProvider({
  children,
}: React.PropsWithChildren<unknown>): JSX.Element {
  const [panelsState, setPanelsState] = useState<PanelsState>({
    configById: {},
    globalVariables: {},
    userNodes: {},
    linkedGlobalVariables: [],
    playbackConfig: defaultPlaybackConfig,
  });

  // FIXME: better to decouple these functions from provider for testing? just use existing
  // functions for now?

  const savePanelConfigs = useCallback(
    (configs: { [id: string]: Partial<PanelConfig> }) =>
      setPanelsState((state) => {
        const configById = { ...state.configById };
        for (const [id, config] of Object.entries(configs)) {
          configById[id] = { ...state.configById[id], ...config };
        }
        return { ...state, configById: trimUnusedSavedProps(state.layout, configById) };
      }),
    [],
  );
  const updatePanelConfigs = useCallback(
    (panelType: string, updater: (config: PanelConfig) => PanelConfig) => {
      setPanelsState((state) => {
        const configById = { ...state.configById };
        for (const [id, config] of Object.entries(configById)) {
          if (getPanelTypeFromId(id) === panelType) {
            configById[id] = updater(config);
          }
        }
        return { ...state, configById: configById };
      });
    },
    [],
  );
  const createTabPanel = useCallback((payload: CreateTabPanelPayload) => {}, []);
  const changePanelLayout = useCallback((payload: ChangePanelLayoutPayload) => {}, []);
  const loadLayout = useCallback((payload: LoadLayoutPayload) => {}, []);
  const overwriteGlobalVariables = useCallback((payload: { [key: string]: unknown }) => {}, []);
  const setGlobalVariables = useCallback((payload: { [key: string]: unknown }) => {}, []);
  const setUserNodes = useCallback((payload: UserNodes) => {}, []);
  const setLinkedGlobalVariables = useCallback((payload: LinkedGlobalVariables) => {}, []);
  const setPlaybackConfig = useCallback((payload: Partial<PlaybackConfig>) => {}, []);
  const closePanel = useCallback((payload: ClosePanelPayload) => {}, []);
  const splitPanel = useCallback((payload: SplitPanelPayload) => {}, []);
  const swapPanel = useCallback((payload: SwapPanelPayload) => {}, []);
  const moveTab = useCallback((payload: MoveTabPayload) => {}, []);
  const addPanel = useCallback((payload: AddPanelPayload) => {}, []);
  const dropPanel = useCallback((payload: DropPanelPayload) => {}, []);
  const startDrag = useCallback((payload: StartDragPayload) => {}, []);
  const endDrag = useCallback((payload: EndDragPayload) => {}, []);

  const value: CurrentLayout = useShallowMemo({
    layout: panelsState,
    savePanelConfigs,
    updatePanelConfigs,
    createTabPanel,
    changePanelLayout,
    loadLayout,
    overwriteGlobalVariables,
    setGlobalVariables,
    setUserNodes,
    setLinkedGlobalVariables,
    setPlaybackConfig,
    closePanel,
    splitPanel,
    swapPanel,
    moveTab,
    addPanel,
    dropPanel,
    startDrag,
    endDrag,
  });

  return <CurrentLayoutContext.Provider value={value}>{children}</CurrentLayoutContext.Provider>;
}
