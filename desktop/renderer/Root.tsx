// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { ReactElement, useCallback, useMemo } from "react";

import {
  App,
  ErrorBoundary,
  MultiProvider,
  PlayerSourceDefinition,
  ThemeProvider,
  UserProfileLocalStorageProvider,
  StudioToastProvider,
  // fixme - expose these at top level? this one should be in desktop?
  ros1PlayerSource,
} from "@foxglove/studio-base";

import { Desktop } from "../common/types";
import NativeAppMenuProvider from "./components/NativeAppMenuProvider";
import NativeStorageAppConfigurationProvider from "./components/NativeStorageAppConfigurationProvider";
import NativeStorageLayoutCacheProvider from "./components/NativeStorageLayoutCacheProvider";
import ExtensionLoaderProvider from "./providers/ExtensionLoaderProvider";
import LayoutStorageProviders from "./providers/LayoutStorageProviders";

const DEMO_BAG_URL = "https://storage.googleapis.com/foxglove-public-assets/demo.bag";

const desktopBridge = (global as unknown as { desktopBridge: Desktop }).desktopBridge;

export default function Root(): ReactElement {
  const playerSources: PlayerSourceDefinition[] = [ros1PlayerSource];

  const providers = [
    /* eslint-disable react/jsx-key */
    <StudioToastProvider />,
    <NativeStorageAppConfigurationProvider />,
    <NativeStorageLayoutCacheProvider />,
    <LayoutStorageProviders />,
    <NativeAppMenuProvider />,
    <UserProfileLocalStorageProvider />,
    <ExtensionLoaderProvider />,
    /* eslint-enable react/jsx-key */
  ];

  const deepLinks = useMemo(() => desktopBridge.getDeepLinks(), []);

  const handleToolbarDoubleClick = useCallback(() => desktopBridge.handleToolbarDoubleClick(), []);

  return (
    <ThemeProvider>
      <ErrorBoundary>
        <MultiProvider providers={providers}>
          <App
            demoBagUrl={DEMO_BAG_URL}
            deepLinks={deepLinks}
            onFullscreenToggle={handleToolbarDoubleClick}
            availableSources={playerSources}
          />
        </MultiProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
