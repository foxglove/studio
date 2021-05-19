// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useEffect } from "react";
import { useAsync, useThrottle } from "react-use";
import { v4 as uuidv4 } from "uuid";

import {
  useCurrentLayoutActions,
  useCurrentLayoutSelector,
} from "@foxglove/studio-base/context/CurrentLayoutContext";
import { useLayoutStorage } from "@foxglove/studio-base/context/LayoutStorageContext";
import sendNotification from "@foxglove/studio-base/util/sendNotification";

// LayoutStorageReduxAdapter persists the current panel state from redux to the current LayoutStorage context
export default function LayoutStorageReduxAdapter(): ReactNull {
  const { loadLayout } = useCurrentLayoutActions();
  const panelsState = useCurrentLayoutSelector((state) => state);

  // Debounce the panel state to avoid persisting the layout constantly as the user is adjusting it
  const throttledPanelsState = useThrottle(panelsState, 1000 /* 1 second */);

  const layoutStorage = useLayoutStorage();

  // save panel state to our storage
  const { error } = useAsync(async () => {
    if (throttledPanelsState.id === undefined) {
      return;
    }

    const layout = {
      id: throttledPanelsState.id,
      name: throttledPanelsState.name ?? "unnamed",
      state: throttledPanelsState,
    };

    // save to our storage
    await layoutStorage.put(layout);
  }, [layoutStorage, throttledPanelsState]);

  // set an id if panel is missing one
  // FIXME: can we remove this?
  useEffect(() => {
    if (panelsState.id === undefined) {
      panelsState.id = uuidv4();
      panelsState.name = panelsState.name ?? "unnamed";
      loadLayout(panelsState);
    }
  }, [loadLayout, panelsState]);

  useEffect(() => {
    if (error) {
      sendNotification(error.message, Error, "app", "error");
    }
  }, [error]);

  return ReactNull;
}
