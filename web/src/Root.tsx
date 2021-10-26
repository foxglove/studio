// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useMemo } from "react";

import {
  App,
  ErrorBoundary,
  MultiProvider,
  IPlayerFactory,
  ThemeProvider,
  UserProfileLocalStorageProvider,
  StudioToastProvider,
  CssBaseline,
  GlobalCss,
  ConsoleApi,
  ConsoleApiContext,
  ConsoleApiRemoteLayoutStorageProvider,
  Ros1LocalBagPlayerFactory,
  Ros2LocalBagPlayerFactory,
  RosbridgePlayerFactory,
  Ros1RemoteBagPlayerFactory,
  FoxgloveDataPlatformPlayerFactory,
} from "@foxglove/studio-base";

import ConsoleApiCookieUserProvider from "./components/ConsoleApiCookieCurrentUserProvider";
import LocalStorageAppConfigurationProvider from "./components/LocalStorageAppConfigurationProvider";
import LocalStorageLayoutStorageProvider from "./components/LocalStorageLayoutStorageProvider";
import Ros1UnavailablePlayerFactory from "./playerFactories/Ros1UnavailablePlayerFactory";
import Ros2UnavailablePlayerFactory from "./playerFactories/Ros2UnavailablePlayerFactory";
import VelodyneUnavailablePlayerFactory from "./playerFactories/VelodyneUnavailablePlayerFactory";
import ExtensionLoaderProvider from "./providers/ExtensionLoaderProvider";

const DEMO_BAG_URL = "https://storage.googleapis.com/foxglove-public-assets/demo.bag";

const dataSources: IPlayerFactory[] = [
  new Ros1UnavailablePlayerFactory(),
  new Ros1LocalBagPlayerFactory(),
  new Ros1RemoteBagPlayerFactory(),
  new Ros2UnavailablePlayerFactory(),
  new Ros2LocalBagPlayerFactory(),
  new RosbridgePlayerFactory(),
  new VelodyneUnavailablePlayerFactory(),
  new FoxgloveDataPlatformPlayerFactory(),
];

export function Root({ loadWelcomeLayout }: { loadWelcomeLayout: boolean }): JSX.Element {
  const api = useMemo(() => new ConsoleApi(process.env.FOXGLOVE_API_URL!), []);

  const providers = [
    /* eslint-disable react/jsx-key */
    <LocalStorageAppConfigurationProvider />,
    <ConsoleApiContext.Provider value={api} />,
    <ConsoleApiCookieUserProvider />,
    <ConsoleApiRemoteLayoutStorageProvider />,
    <StudioToastProvider />,
    <LocalStorageLayoutStorageProvider />,
    <UserProfileLocalStorageProvider />,
    <ExtensionLoaderProvider />,
    /* eslint-enable react/jsx-key */
  ];

  return (
    <ThemeProvider>
      <GlobalCss />
      <CssBaseline>
        <ErrorBoundary>
          <MultiProvider providers={providers}>
            <App
              loadWelcomeLayout={loadWelcomeLayout}
              demoBagUrl={DEMO_BAG_URL}
              availableSources={dataSources}
            />
          </MultiProvider>
        </ErrorBoundary>
      </CssBaseline>
    </ThemeProvider>
  );
}
