// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
import { isEqual } from "lodash";
import { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState } from "react";
import { getNodeAtPath } from "react-mosaic-component";
import { useToasts } from "react-toast-notifications";
import { useAsync, useThrottle } from "react-use";
import { v4 as uuidv4 } from "uuid";

import { useUndoRedo } from "@foxglove/hooks";
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
import { useLayoutStorage } from "@foxglove/studio-base/context/LayoutStorageContext";
import { useUserProfileStorage } from "@foxglove/studio-base/context/UserProfileStorageContext";
import useShallowMemo from "@foxglove/studio-base/hooks/useShallowMemo";

import panelsReducer, { defaultPlaybackConfig } from "./reducers";

const LAYOUT_HISTORY_SIZE = 20;
export const LAYOUT_HISTORY_THROTTLE_MS = 1000; // Exported for tests

const DEFAULT_LAYOUT: PanelsState = {
  configById: {},
  globalVariables: {},
  userNodes: {},
  linkedGlobalVariables: [],
  playbackConfig: defaultPlaybackConfig,
};

function migrateLegacyLayoutFromLocalStorage() {
  let result: PanelsState | undefined;
  for (const key of ["webvizGlobalState", "studioGlobalState"]) {
    const value = localStorage.getItem(key);
    if (value != undefined) {
      result = JSON.parse(value)?.panels;
    }
    localStorage.removeItem(key);
  }
  return result;
}

/**
 * Concrete implementation of CurrentLayoutContext.Provider which handles automatically saving and
 * restoring the current layout from LayoutStorage. Must be rendered inside a LayoutStorage
 * provider.
 */
export default function CurrentLayoutProvider({
  children,
}: //FIXME: initialLayout?
React.PropsWithChildren<unknown>): JSX.Element | ReactNull {
  const { addToast } = useToasts();
  const [mosaicId] = useState(() => uuidv4());

  const { getUserProfile, setUserProfile } = useUserProfileStorage();
  const layoutStorage = useLayoutStorage();

  const [panelsState, dispatch] = useReducer(panelsReducer, DEFAULT_LAYOUT);

  const loadLayoutState = useAsync(async () => {
    try {
      const legacyLayout = migrateLegacyLayoutFromLocalStorage();
      if (legacyLayout != undefined) {
        legacyLayout.id ??= uuidv4();
        legacyLayout.name ??= "unnamed";
        dispatch({ type: "LOAD_LAYOUT", payload: legacyLayout });
        return;
      }
      const { currentLayoutId } = await getUserProfile();
      if (currentLayoutId == undefined) {
        dispatch({ type: "LOAD_LAYOUT", payload: DEFAULT_LAYOUT });
        return;
      }
      const layout = await layoutStorage.get(currentLayoutId);
      if (layout?.state) {
        dispatch({ type: "LOAD_LAYOUT", payload: layout.state });
        return;
      }
    } catch (error) {
      console.error(error);
      addToast(`The current layout could not be loaded. ${error.toString()}`, {
        appearance: "error",
        id: "CurrentLayoutProvider.load",
      });
    }
    dispatch({ type: "LOAD_LAYOUT", payload: DEFAULT_LAYOUT });
  }, [addToast, getUserProfile, layoutStorage]);

  // Debounce the panel state to avoid persisting the layout constantly as the user is adjusting it
  const throttledPanelsState = useThrottle(panelsState, 1000 /* 1 second */);
  const previousSavedState = useRef(panelsState);
  useEffect(() => {
    if (throttledPanelsState === previousSavedState.current) {
      // Don't save a layout that we just loaded
      // FIXME- change this when loading layout?
      return;
    }
    previousSavedState.current = throttledPanelsState;
    if (throttledPanelsState.id == undefined || throttledPanelsState.name == undefined) {
      addToast(`The current layout could not be saved: missing id or name.`, {
        appearance: "error",
        id: "CurrentLayoutProvider.layoutStorage.put",
      });
      return;
    }
    layoutStorage
      .put({
        id: throttledPanelsState.id,
        name: throttledPanelsState.name,
        state: throttledPanelsState,
      })
      .catch((error) => {
        console.error(error);
        addToast(`The current layout could not be saved. ${error.toString()}`, {
          appearance: "error",
          id: "CurrentLayoutProvider.layoutStorage.put",
        });
      });
  }, [addToast, layoutStorage, throttledPanelsState]);

  useEffect(() => {
    setUserProfile({ currentLayoutId: panelsState.id }).catch((error) => {
      console.error(error);
      addToast(`The current layout could not be saved. ${error.toString()}`, {
        appearance: "error",
        id: "CurrentLayoutProvider.setUserProfile",
      });
    });
  }, [setUserProfile, panelsState.id, addToast]);

  // FIXME: move internals to a class to allow for easier mocking
  const [selectedPanelIds, setSelectedPanelIds] = useState<readonly string[]>([]);

  const panelsStateRef = useRef(panelsState);
  const selectedPanelIdsRef = useRef(selectedPanelIds);
  useLayoutEffect(() => {
    panelsStateRef.current = panelsState;
    selectedPanelIdsRef.current = selectedPanelIds;
  });

  const getCurrentLayout = useCallback(() => panelsStateRef.current, []);
  const getSelectedPanelIds = useCallback(() => selectedPanelIdsRef.current, []);

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
  const createTabPanel = useCallback((payload: CREATE_TAB_PANEL["payload"]) => {
    dispatch({ type: "CREATE_TAB_PANEL", payload });
    setSelectedPanelIds([]);
  }, []);
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
  const closePanel = useCallback((payload: CLOSE_PANEL["payload"]) => {
    dispatch({ type: "CLOSE_PANEL", payload });
    // Deselect the removed panel
    const closedId = getNodeAtPath(payload.root, payload.path);
    setSelectedPanelIds((ids) => ids.filter((id) => id !== closedId));
  }, []);
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

  const { undo: undoLayoutChange, redo: redoLayoutChange } = useUndoRedo(panelsState, loadLayout, {
    isEqual,
    historySize: LAYOUT_HISTORY_SIZE,
    throttleMs: LAYOUT_HISTORY_THROTTLE_MS,
  });

  const actions = useShallowMemo({
    getCurrentLayout,
    undoLayoutChange,
    redoLayoutChange,
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

  const value: CurrentLayout = useShallowMemo({
    state: panelsState,
    mosaicId,
    actions,
    selectedPanelIds,
    setSelectedPanelIds,
    getSelectedPanelIds,
  });

  if (loadLayoutState.loading) {
    return ReactNull;
  }

  return <CurrentLayoutContext.Provider value={value}>{children}</CurrentLayoutContext.Provider>;
}
