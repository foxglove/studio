// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useEffect } from "react";

import {
  App,
  ErrorBoundary,
  MultiProvider,
  PlayerSourceDefinition,
  ThemeProvider,
  UserProfileLocalStorageProvider,
  StudioToastProvider,
  CacheOnlyLayoutStorageProvider,
  useConfirm,
} from "@foxglove/studio-base";

import LocalStorageAppConfigurationProvider from "./components/LocalStorageAppConfigurationProvider";
import LocalStorageLayoutCacheProvider from "./components/LocalStorageLayoutCacheProvider";
import ExtensionLoaderProvider from "./providers/ExtensionLoaderProvider";

const DEMO_BAG_URL = "https://storage.googleapis.com/foxglove-public-assets/demo.bag";

export function Root({ loadWelcomeLayout }: { loadWelcomeLayout: boolean }): JSX.Element {
  const playerSources: PlayerSourceDefinition[] = [
    {
      id: "ros1-socket",
      name: "ROS 1",
      component: function Ros1() {
        const { modal, open } = useConfirm({
          title: "Download desktop",
          confirmStyle: "primary",
          action: () => {},
        });

        useEffect(() => {
          open();
        }, [open]);
        return <>{modal}</>;
      },
    },
  ];

  const providers = [
    /* eslint-disable react/jsx-key */
    <StudioToastProvider />,
    <LocalStorageAppConfigurationProvider />,
    <LocalStorageLayoutCacheProvider />,
    <CacheOnlyLayoutStorageProvider />,
    <UserProfileLocalStorageProvider />,
    <ExtensionLoaderProvider />,
    /* eslint-enable react/jsx-key */
  ];

  return (
    <ThemeProvider>
      <ErrorBoundary>
        <MultiProvider providers={providers}>
          <App
            loadWelcomeLayout={loadWelcomeLayout}
            demoBagUrl={DEMO_BAG_URL}
            availableSources={playerSources}
          />
        </MultiProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
