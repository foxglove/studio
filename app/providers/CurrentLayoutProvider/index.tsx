// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useToasts } from "react-toast-notifications";
import { useAsync, useThrottle } from "react-use";
import { v4 as uuidv4 } from "uuid";

import CurrentLayoutContext from "@foxglove/studio-base/context/CurrentLayoutContext";
import { PanelsState } from "@foxglove/studio-base/context/CurrentLayoutContext/actions";
import { useLayoutStorage } from "@foxglove/studio-base/context/LayoutStorageContext";
import { useUserProfileStorage } from "@foxglove/studio-base/context/UserProfileStorageContext";
import CurrentLayoutState from "@foxglove/studio-base/providers/CurrentLayoutProvider/CurrentLayoutState";

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
}: React.PropsWithChildren<unknown>): JSX.Element | ReactNull {
  const { addToast } = useToasts();

  const { getUserProfile, setUserProfile } = useUserProfileStorage();
  const layoutStorage = useLayoutStorage();

  const stateInstance = useMemo((): CurrentLayoutState => new CurrentLayoutState(), []);
  const [panelsState, setPanelsState] = useState(() => stateInstance.actions.getCurrentLayout());

  useLayoutEffect(() => {
    const listener = (state: PanelsState) => setPanelsState(state);
    stateInstance.addPanelsStateListener(listener);
    return () => stateInstance.removePanelsStateListener(listener);
  }, [stateInstance]);

  const loadLayoutState = useAsync(async () => {
    try {
      const legacyLayout = migrateLegacyLayoutFromLocalStorage();
      if (legacyLayout != undefined) {
        legacyLayout.id ??= uuidv4();
        legacyLayout.name ??= "unnamed";
        stateInstance.actions.loadLayout(legacyLayout);
        return;
      }
      const { currentLayoutId } = await getUserProfile();
      if (currentLayoutId == undefined) {
        return;
      }
      const layout = await layoutStorage.get(currentLayoutId);
      if (layout?.state) {
        stateInstance.actions.loadLayout(layout.state);
      }
    } catch (error) {
      console.error(error);
      addToast(`The current layout could not be loaded. ${error.toString()}`, {
        appearance: "error",
        id: "CurrentLayoutProvider.load",
      });
    }
  }, [addToast, getUserProfile, layoutStorage, stateInstance]);

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
    //FIXME: combine with above?
    setUserProfile({ currentLayoutId: panelsState.id }).catch((error) => {
      console.error(error);
      addToast(`The current layout could not be saved. ${error.toString()}`, {
        appearance: "error",
        id: "CurrentLayoutProvider.setUserProfile",
      });
    });
  }, [setUserProfile, panelsState.id, addToast]);

  if (loadLayoutState.loading) {
    return ReactNull;
  }

  return (
    <CurrentLayoutContext.Provider value={stateInstance}>{children}</CurrentLayoutContext.Provider>
  );
}
