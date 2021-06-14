// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useMemo } from "react";

import LayoutMenu from "@foxglove/studio-base/components/LayoutMenu";
import CurrentLayoutContext from "@foxglove/studio-base/context/CurrentLayoutContext";
import LocalLayoutStorageContext from "@foxglove/studio-base/context/LocalLayoutStorageContext";
import CurrentLayoutState, {
  DEFAULT_LAYOUT_FOR_TESTS,
} from "@foxglove/studio-base/providers/CurrentLayoutProvider/CurrentLayoutState";
import { defaultPlaybackConfig } from "@foxglove/studio-base/providers/CurrentLayoutProvider/reducers";
import MockLocalLayoutStorage from "@foxglove/studio-base/services/MockLocalLayoutStorage";

export default {
  title: "components/LayoutMenu",
  component: LayoutMenu,
};

export function Empty(): JSX.Element {
  const storage = useMemo(() => new MockLocalLayoutStorage(), []);
  const currentLayout = useMemo(() => new CurrentLayoutState(DEFAULT_LAYOUT_FOR_TESTS), []);

  return (
    <div style={{ display: "flex", height: 400 }}>
      <CurrentLayoutContext.Provider value={currentLayout}>
        <LocalLayoutStorageContext.Provider value={storage}>
          <LayoutMenu defaultIsOpen />
        </LocalLayoutStorageContext.Provider>
      </CurrentLayoutContext.Provider>
    </div>
  );
}

export function LayoutList(): JSX.Element {
  const storage = useMemo(
    () =>
      new MockLocalLayoutStorage([
        {
          id: "not-current",
          name: "Another Layout",
          path: undefined,
          state: undefined,
        },
        {
          id: "test-id",
          name: "Current Layout",
          path: undefined,
          state: undefined,
        },
        {
          id: "short-id",
          name: "Short",
          path: undefined,
          state: undefined,
        },
      ]),
    [],
  );

  const mockLayoutContext = useMemo(() => {
    const mockLayout = {
      id: "test-id",
      configById: {},
      globalVariables: {},
      userNodes: {},
      linkedGlobalVariables: [],
      playbackConfig: defaultPlaybackConfig,
    };
    const state = new CurrentLayoutState(DEFAULT_LAYOUT_FOR_TESTS);
    state.actions.loadLayout(mockLayout);
    return state;
  }, []);

  return (
    <div style={{ display: "flex", height: 400 }}>
      <CurrentLayoutContext.Provider value={mockLayoutContext}>
        <LocalLayoutStorageContext.Provider value={storage}>
          <LayoutMenu defaultIsOpen />
        </LocalLayoutStorageContext.Provider>
      </CurrentLayoutContext.Provider>
    </div>
  );
}
