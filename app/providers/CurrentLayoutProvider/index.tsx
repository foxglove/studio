// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
import { useCallback, useReducer } from "react";

import CurrentLayoutContext, {
  CurrentLayout,
} from "@foxglove/studio-base/context/CurrentLayoutContext";
import {
  ADD_PANEL,
  CHANGE_PANEL_LAYOUT,
  CLOSE_PANEL,
  CREATE_TAB_PANEL,
  DROP_PANEL,
  END_DRAG,
  LOAD_LAYOUT,
  MOVE_TAB,
  OVERWRITE_GLOBAL_DATA,
  PanelsActions,
  PanelsState,
  SAVE_FULL_PANEL_CONFIG,
  SAVE_PANEL_CONFIGS,
  SET_GLOBAL_DATA,
  SET_LINKED_GLOBAL_VARIABLES,
  SET_PLAYBACK_CONFIG,
  SET_STUDIO_NODES,
  SPLIT_PANEL,
  START_DRAG,
  SWAP_PANEL,
} from "@foxglove/studio-base/context/CurrentLayoutContext/actions";
import useShallowMemo from "@foxglove/studio-base/hooks/useShallowMemo";

import panelsReducer, { defaultPlaybackConfig } from "./reducers";

export default function CurrentLayoutProvider({
  children,
}: React.PropsWithChildren<unknown>): JSX.Element {
  const [panelsState, dispatch] = useReducer(
    (state: PanelsState, action: PanelsActions) => {
      return panelsReducer(state, action);
    },
    {
      configById: {},
      globalVariables: {},
      userNodes: {},
      linkedGlobalVariables: [],
      playbackConfig: defaultPlaybackConfig,
    },
  );

  const savePanelConfigs = useCallback(
    (payload: SAVE_PANEL_CONFIGS["payload"]) => dispatch({ type: "SAVE_PANEL_CONFIGS", payload }),
    [],
  );
  const updatePanelConfigs = useCallback(
    (
      panelType: SAVE_FULL_PANEL_CONFIG["payload"]["panelType"],
      perPanelFunc: SAVE_FULL_PANEL_CONFIG["payload"]["perPanelFunc"],
    ) => dispatch({ type: "SAVE_FULL_PANEL_CONFIG", payload: { panelType, perPanelFunc } }),
    [],
  );
  const createTabPanel = useCallback(
    (payload: CREATE_TAB_PANEL["payload"]) => dispatch({ type: "CREATE_TAB_PANEL", payload }),
    [],
  );
  const changePanelLayout = useCallback(
    (payload: CHANGE_PANEL_LAYOUT["payload"]) => dispatch({ type: "CHANGE_PANEL_LAYOUT", payload }),
    [],
  );
  const loadLayout = useCallback(
    (payload: LOAD_LAYOUT["payload"]) => dispatch({ type: "LOAD_LAYOUT", payload }),
    [],
  );
  const overwriteGlobalVariables = useCallback(
    (payload: OVERWRITE_GLOBAL_DATA["payload"]) =>
      dispatch({ type: "OVERWRITE_GLOBAL_DATA", payload }),
    [],
  );
  const setGlobalVariables = useCallback(
    (payload: SET_GLOBAL_DATA["payload"]) => dispatch({ type: "SET_GLOBAL_DATA", payload }),
    [],
  );
  const setUserNodes = useCallback(
    (payload: SET_STUDIO_NODES["payload"]) => dispatch({ type: "SET_USER_NODES", payload }),
    [],
  );
  const setLinkedGlobalVariables = useCallback(
    (payload: SET_LINKED_GLOBAL_VARIABLES["payload"]) =>
      dispatch({ type: "SET_LINKED_GLOBAL_VARIABLES", payload }),
    [],
  );
  const setPlaybackConfig = useCallback(
    (payload: SET_PLAYBACK_CONFIG["payload"]) => dispatch({ type: "SET_PLAYBACK_CONFIG", payload }),
    [],
  );
  const closePanel = useCallback(
    (payload: CLOSE_PANEL["payload"]) => dispatch({ type: "CLOSE_PANEL", payload }),
    [],
  );
  const splitPanel = useCallback(
    (payload: SPLIT_PANEL["payload"]) => dispatch({ type: "SPLIT_PANEL", payload }),
    [],
  );
  const swapPanel = useCallback(
    (payload: SWAP_PANEL["payload"]) => dispatch({ type: "SWAP_PANEL", payload }),
    [],
  );
  const moveTab = useCallback(
    (payload: MOVE_TAB["payload"]) => dispatch({ type: "MOVE_TAB", payload }),
    [],
  );
  const addPanel = useCallback(
    (payload: ADD_PANEL["payload"]) => dispatch({ type: "ADD_PANEL", payload }),
    [],
  );
  const dropPanel = useCallback(
    (payload: DROP_PANEL["payload"]) => dispatch({ type: "DROP_PANEL", payload }),
    [],
  );
  const startDrag = useCallback(
    (payload: START_DRAG["payload"]) => dispatch({ type: "START_DRAG", payload }),
    [],
  );
  const endDrag = useCallback(
    (payload: END_DRAG["payload"]) => dispatch({ type: "END_DRAG", payload }),
    [],
  );

  const value: CurrentLayout = useShallowMemo({
    state: panelsState,
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
