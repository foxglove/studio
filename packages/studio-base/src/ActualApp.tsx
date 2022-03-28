// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { ConsoleApiCookieCurrentUserProvider } from "@foxglove/studio-base/providers/ConsoleApiCookieUserProvider";
import { ConsoleApiDialogCurrentUserProvider } from "@foxglove/studio-base/providers/ConsoleApiDialogCurrentUserProvider";

import App from "./App";
import { ColorSchemeThemeProvider } from "./components/ColorSchemeThemeProvider";
import CssBaseline from "./components/CssBaseline";
import ErrorBoundary from "./components/ErrorBoundary";
import GlobalCss from "./components/GlobalCss";
import MultiProvider from "./components/MultiProvider";
import StudioToastProvider from "./components/StudioToastProvider";
import AppConfigurationContext, { IAppConfiguration } from "./context/AppConfigurationContext";
import ConsoleApiContext from "./context/ConsoleApiContext";
import ExtensionLoaderContext, { ExtensionLoader } from "./context/ExtensionLoaderContext";
import LayoutStorageContext from "./context/LayoutStorageContext";
import NativeAppMenuContext, { INativeAppMenu } from "./context/NativeAppMenuContext";
import NativeWindowContext, { INativeWindow } from "./context/NativeWindowContext";
import { IDataSourceFactory } from "./context/PlayerSelectionContext";
import ConsoleApiRemoteLayoutStorageProvider from "./providers/ConsoleApiRemoteLayoutStorageProvider";
import UserProfileLocalStorageProvider from "./providers/UserProfileLocalStorageProvider";
import ConsoleApi from "./services/ConsoleApi";
import { ILayoutStorage } from "./services/ILayoutStorage";

type AppProps = {
  appConfiguration: IAppConfiguration;
  dataSources: IDataSourceFactory[];
  consoleApi: ConsoleApi;
  layoutStorage: ILayoutStorage;
  extensionLoader: ExtensionLoader;
  nativeAppMenu?: INativeAppMenu;
  nativeWindow?: INativeWindow;
  useDialogAuth?: boolean;
};

export function ActualApp(props: AppProps): JSX.Element {
  const {
    appConfiguration,
    dataSources,
    layoutStorage,
    consoleApi,
    extensionLoader,
    nativeAppMenu,
    nativeWindow,
    useDialogAuth,
  } = props;

  const CurrentUserProviderComponent =
    useDialogAuth === true
      ? ConsoleApiDialogCurrentUserProvider
      : ConsoleApiCookieCurrentUserProvider;

  const providers = [
    /* eslint-disable react/jsx-key */
    <ConsoleApiContext.Provider value={consoleApi} />,
    <ConsoleApiRemoteLayoutStorageProvider />,
    <CurrentUserProviderComponent />,
    <StudioToastProvider />,
    <LayoutStorageContext.Provider value={layoutStorage} />,
    <UserProfileLocalStorageProvider />,
    <ExtensionLoaderContext.Provider value={extensionLoader} />,
    /* eslint-enable react/jsx-key */
  ];

  if (nativeAppMenu) {
    providers.push(<NativeAppMenuContext.Provider value={nativeAppMenu} />);
  }

  if (nativeWindow) {
    providers.push(<NativeWindowContext.Provider value={nativeWindow} />);
  }

  return (
    <AppConfigurationContext.Provider value={appConfiguration}>
      <ColorSchemeThemeProvider>
        <GlobalCss />
        <CssBaseline>
          <ErrorBoundary>
            <MultiProvider providers={providers}>
              <App availableSources={dataSources} deepLinks={[window.location.href]} />;
            </MultiProvider>
          </ErrorBoundary>
        </CssBaseline>
      </ColorSchemeThemeProvider>
    </AppConfigurationContext.Provider>
  );
}
