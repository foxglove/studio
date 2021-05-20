// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useMemo } from "react";

import LayoutMenu from "@foxglove/studio-base/components/LayoutMenu";
import CurrentLayoutContext, {
  CurrentLayout,
} from "@foxglove/studio-base/context/CurrentLayoutContext";
import LayoutStorageContext, {
  Layout,
  LayoutStorage,
} from "@foxglove/studio-base/context/LayoutStorageContext";
import CurrentLayoutProvider from "@foxglove/studio-base/providers/CurrentLayoutProvider";
import { defaultPlaybackConfig } from "@foxglove/studio-base/providers/CurrentLayoutProvider/reducers";

class FakeLayoutStorage implements LayoutStorage {
  private _layouts: Layout[];

  constructor(layouts: Layout[] = []) {
    this._layouts = layouts;
  }
  list(): Promise<Layout[]> {
    return Promise.resolve(this._layouts);
  }
  get(_id: string): Promise<Layout | undefined> {
    throw new Error("Method not implemented.");
  }
  put(_layout: unknown): Promise<void> {
    throw new Error("Method not implemented.");
  }
  delete(_id: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
}

function makeMockLayoutContext(): CurrentLayout {
  const currentLayout = {
    id: "test-id",
    configById: {},
    globalVariables: {},
    userNodes: {},
    linkedGlobalVariables: [],
    playbackConfig: defaultPlaybackConfig,
  };
  return {
    state: currentLayout,
    mosaicId: "x",
    selectedPanelIds: [],
    getSelectedPanelIds: () => [],
    setSelectedPanelIds: () => {},
    actions: {
      getCurrentLayout: () => currentLayout,
      undoLayoutChange: () => {},
      redoLayoutChange: () => {},
      savePanelConfigs: () => {},
      updatePanelConfigs: () => {},
      createTabPanel: () => {},
      changePanelLayout: () => {},
      loadLayout: () => {},
      overwriteGlobalVariables: () => {},
      setGlobalVariables: () => {},
      setUserNodes: () => {},
      setLinkedGlobalVariables: () => {},
      setPlaybackConfig: () => {},
      closePanel: () => {},
      splitPanel: () => {},
      swapPanel: () => {},
      moveTab: () => {},
      addPanel: () => {},
      dropPanel: () => {},
      startDrag: () => {},
      endDrag: () => {},
    },
  };
}

export default {
  title: "components/LayoutMenu",
  component: LayoutMenu,
};

export function Empty(): JSX.Element {
  const storage = useMemo(() => new FakeLayoutStorage(), []);

  return (
    <div style={{ display: "flex", height: 400 }}>
      <CurrentLayoutProvider>
        <LayoutStorageContext.Provider value={storage}>
          <LayoutMenu defaultIsOpen />
        </LayoutStorageContext.Provider>
      </CurrentLayoutProvider>
    </div>
  );
}

export function LayoutList(): JSX.Element {
  const storage = useMemo(
    () =>
      new FakeLayoutStorage([
        {
          id: "not-current",
          name: "Another Layout",
          state: undefined,
        },
        {
          id: "test-id",
          name: "Current Layout",
          state: undefined,
        },
        {
          id: "short-id",
          name: "Short",
          state: undefined,
        },
      ]),
    [],
  );
  const mockLayoutContext = useMemo(() => makeMockLayoutContext(), []);

  return (
    <div style={{ display: "flex", height: 400 }}>
      <CurrentLayoutContext.Provider value={mockLayoutContext}>
        <LayoutStorageContext.Provider value={storage}>
          <LayoutMenu defaultIsOpen />
        </LayoutStorageContext.Provider>
      </CurrentLayoutContext.Provider>
    </div>
  );
}
