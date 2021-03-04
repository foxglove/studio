// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { ReactElement, useEffect, useMemo, useState } from "react";

import { OsContextSingleton } from "@foxglove-studio/app/OsContext";
import { NativeFileMenuPlayerSelection } from "@foxglove-studio/app/components/NativeFileMenuPlayerSelection";
import Root from "@foxglove-studio/app/components/Root";
import {
  PlayerSelectionDefinition,
  PlayerSelectionProvider,
} from "@foxglove-studio/app/context/PlayerSelection";

export function App(): ReactElement {
  const [isFullScreen, setFullScreen] = useState(false);

  // On MacOS we use inset window controls, when the window is full-screen these controls are not present
  // We detect the full screen state and adjust our rendering accordingly
  // Note: this does not removed the handlers so should be done at the highest component level
  useEffect(() => {
    OsContextSingleton?.addWindowEventListener("enter-full-screen", () => setFullScreen(true));
    OsContextSingleton?.addWindowEventListener("leave-full-screen", () => setFullScreen(false));
  }, []);

  const insetWindowControls = useMemo(() => {
    return OsContextSingleton?.platform === "darwin" && !isFullScreen;
  }, [isFullScreen]);

  const playerSources: PlayerSelectionDefinition[] = [
    {
      name: "Bag File",
      type: "file",
    },
    {
      name: "WebSocket",
      type: "url",
    },
  ];

  return (
    <>
      <PlayerSelectionProvider items={playerSources}>
        <NativeFileMenuPlayerSelection />
        <Root
          insetWindowControls={insetWindowControls}
          onToolbarDoubleClick={OsContextSingleton?.handleToolbarDoubleClick}
        />
      </PlayerSelectionProvider>
    </>
  );
}
