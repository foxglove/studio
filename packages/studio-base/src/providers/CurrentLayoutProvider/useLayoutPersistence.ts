// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { enqueueSnackbar } from "notistack";
import { useCallback, useEffect, useState } from "react";
import { useAsync, useMountedState } from "react-use";
import { useDebounce } from "use-debounce";

import Logger from "@foxglove/log";
import { useAnalytics } from "@foxglove/studio-base/context/AnalyticsContext";
import { LayoutData } from "@foxglove/studio-base/context/CurrentLayoutContext/actions";
import { useLayoutManager } from "@foxglove/studio-base/context/LayoutManagerContext";
import { AppEvent } from "@foxglove/studio-base/services/IAnalytics";
import { LayoutID } from "@foxglove/studio-base/services/ILayoutStorage";

const log = Logger.getLogger(__filename);

const SAVE_INTERVAL_MS = 1000;

type UpdateLayoutParams = { id: LayoutID; data: LayoutData };

/**
 * Handles batching up layout updates and writing them asynchronously to the
 * layout manager so that they don't interfere with things like react event
 * handlers on settings inputs.
 *
 * @returns a function that can be called to persist an updated layout
 */
export function useLayoutPersistence(): (updatedLayout: UpdateLayoutParams) => void {
  const persistLayout = useCallback((updatedLayout: UpdateLayoutParams) => {
    setUnsavedLayouts((old) => ({ ...old, [updatedLayout.id]: updatedLayout }));
  }, []);

  const layoutManager = useLayoutManager();

  const [unsavedLayouts, setUnsavedLayouts] = useState<Record<LayoutID, UpdateLayoutParams>>({});

  const isMounted = useMountedState();

  const analytics = useAnalytics();

  const [debouncedUnsavedLayouts, debouncedUnsavedLayoutActions] = useDebounce(
    unsavedLayouts,
    SAVE_INTERVAL_MS,
  );

  useEffect(() => {
    return () => {
      debouncedUnsavedLayoutActions.flush();
      debouncedUnsavedLayoutActions.cancel();
    };
  }, [debouncedUnsavedLayoutActions]);

  useAsync(async () => {
    const unsavedLayoutsSnapshot = { ...debouncedUnsavedLayouts };
    setUnsavedLayouts({});

    for (const params of Object.values(unsavedLayoutsSnapshot)) {
      try {
        await layoutManager.updateLayout(params);
      } catch (error) {
        log.error(error);
        if (isMounted()) {
          enqueueSnackbar(`Your changes could not be saved. ${error.toString()}`, {
            variant: "error",
            key: "CurrentLayoutProvider.throttledSave",
          });
        }
      }
    }

    await analytics.logEvent(AppEvent.LAYOUT_UPDATE);
  }, [analytics, debouncedUnsavedLayouts, isMounted, layoutManager]);

  return persistLayout;
}
