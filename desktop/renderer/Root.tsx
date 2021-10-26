// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { ReactElement, useMemo } from "react";

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
  VelodynePlayerFactory,
  Ros1RemoteBagPlayerFactory,
  Ros1SocketPlayerFactory,
  Ros2SocketPlayerFactory,
  FoxgloveDataPlatformPlayerFactory,
} from "@foxglove/studio-base";

import { Desktop } from "../common/types";
import ConsoleApiCurrentUserProvider from "./components/ConsoleApiCurrentUserProvider";
import NativeAppMenuProvider from "./components/NativeAppMenuProvider";
import NativeStorageAppConfigurationProvider from "./components/NativeStorageAppConfigurationProvider";
import NativeStorageLayoutStorageProvider from "./components/NativeStorageLayoutStorageProvider";
import NativeWindowProvider from "./components/NativeWindowProvider";
import ExtensionLoaderProvider from "./providers/ExtensionLoaderProvider";

const DEMO_BAG_URL = "https://storage.googleapis.com/foxglove-public-assets/demo.bag";

const desktopBridge = (global as unknown as { desktopBridge: Desktop }).desktopBridge;

const dataSources: IPlayerFactory[] = [
  new Ros1SocketPlayerFactory(),
  new Ros1LocalBagPlayerFactory(),
  new Ros1RemoteBagPlayerFactory(),
  new Ros2SocketPlayerFactory(),
  new Ros2LocalBagPlayerFactory(),
  new RosbridgePlayerFactory(),
  new VelodynePlayerFactory(),
  new FoxgloveDataPlatformPlayerFactory(),
];

export default function Root(): ReactElement {
  const api = useMemo(() => new ConsoleApi(process.env.FOXGLOVE_API_URL!), []);

  const providers = [
    /* eslint-disable react/jsx-key */
    <NativeStorageAppConfigurationProvider />,
    <ConsoleApiContext.Provider value={api} />,
    <ConsoleApiCurrentUserProvider />,
    <ConsoleApiRemoteLayoutStorageProvider />,
    <StudioToastProvider />,
    <NativeStorageLayoutStorageProvider />,
    <NativeAppMenuProvider />,
    <NativeWindowProvider />,
    <UserProfileLocalStorageProvider />,
    <ExtensionLoaderProvider />,
    /* eslint-enable react/jsx-key */
  ];

  const deepLinks = useMemo(() => desktopBridge.getDeepLinks(), []);

  return (
    <ThemeProvider>
      <GlobalCss />
      <CssBaseline>
        <ErrorBoundary>
          <MultiProvider providers={providers}>
            <App demoBagUrl={DEMO_BAG_URL} deepLinks={deepLinks} availableSources={dataSources} />
          </MultiProvider>
        </ErrorBoundary>
      </CssBaseline>
    </ThemeProvider>
  );
}
