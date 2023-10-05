// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
import GlobalCss from "@foxglove/studio-base/components/GlobalCss";

import { CustomWindowControlsProps } from "./components/AppBar/CustomWindowControls";
import { ColorSchemeThemeProvider } from "./components/ColorSchemeThemeProvider";
import CssBaseline from "./components/CssBaseline";
import ErrorBoundary from "./components/ErrorBoundary";
import AppConfigurationContext, { IAppConfiguration } from "./context/AppConfigurationContext";
import { INativeAppMenu } from "./context/NativeAppMenuContext";
import { INativeWindow } from "./context/NativeWindowContext";
import { IDataSourceFactory } from "./context/PlayerSelectionContext";
import { ExtensionLoader } from "./services/ExtensionLoader";

export type AppProps = CustomWindowControlsProps & {
  deepLinks: string[];
  appConfiguration: IAppConfiguration;
  dataSources: IDataSourceFactory[];
  extensionLoaders: readonly ExtensionLoader[];
  nativeAppMenu?: INativeAppMenu;
  nativeWindow?: INativeWindow;
  enableLaunchPreferenceScreen?: boolean;
  enableGlobalCss?: boolean;
  appBarLeftInset?: number;
  extraProviders?: JSX.Element[];
  onAppBarDoubleClick?: () => void;
};

export type OutletNode = ({ context }: { context: AppProps }) => JSX.Element;

export function App(props: AppProps & { Outlet: OutletNode }): JSX.Element {
  const {
    appConfiguration,
    dataSources,
    extensionLoaders,
    nativeAppMenu,
    nativeWindow,
    deepLinks,
    enableLaunchPreferenceScreen,
    enableGlobalCss = false,
    appBarLeftInset,
    extraProviders,
    onAppBarDoubleClick,
    Outlet,
  } = props;

  return (
    <AppConfigurationContext.Provider value={appConfiguration}>
      <ColorSchemeThemeProvider>
        {enableGlobalCss && <GlobalCss />}
        <CssBaseline>
          <ErrorBoundary>
            <Outlet
              context={{
                appConfiguration,
                deepLinks,
                dataSources,
                extensionLoaders,
                nativeAppMenu,
                nativeWindow,
                enableLaunchPreferenceScreen,
                appBarLeftInset,
                extraProviders,
                onAppBarDoubleClick,
              }}
            />
          </ErrorBoundary>
        </CssBaseline>
      </ColorSchemeThemeProvider>
    </AppConfigurationContext.Provider>
  );
}
