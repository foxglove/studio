// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { initializeApp } from "@firebase/app";
import { Suspense, useMemo, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Provider as ReduxProvider } from "react-redux";

import Workspace from "@foxglove/studio-base/Workspace";
import ExtensionsProvider from "@foxglove/studio-base/components/ExtensionsProvider";
import MultiProvider from "@foxglove/studio-base/components/MultiProvider";
import { NativeFileMenuPlayerSelection } from "@foxglove/studio-base/components/NativeFileMenuPlayerSelection";
import PlayerManager from "@foxglove/studio-base/components/PlayerManager";
import StudioToastProvider from "@foxglove/studio-base/components/StudioToastProvider";
import AnalyticsProvider from "@foxglove/studio-base/context/AnalyticsProvider";
import { AssetsProvider } from "@foxglove/studio-base/context/AssetContext";
import FirebaseAppContext from "@foxglove/studio-base/context/FirebaseAppContext";
import ModalHost from "@foxglove/studio-base/context/ModalHost";
import { PlayerSourceDefinition } from "@foxglove/studio-base/context/PlayerSelectionContext";
import CurrentLayoutProvider from "@foxglove/studio-base/providers/CurrentLayoutProvider";
import FirebaseLoginProvider from "@foxglove/studio-base/providers/FirebaseLoginProvider";
import URDFAssetLoader from "@foxglove/studio-base/services/URDFAssetLoader";
import getGlobalStore from "@foxglove/studio-base/store/getGlobalStore";

const BuiltinPanelCatalogProvider = React.lazy(
  () => import("@foxglove/studio-base/context/BuiltinPanelCatalogProvider"),
);

type AppProps = {
  availableSources: PlayerSourceDefinition[];
  demoBagUrl?: string;
  deepLinks?: string[];
  onFullscreenToggle?: () => void;
};

// FIXME: where is the right layer to inject this config?
const firebaseConfig = {
  apiKey: "AIzaSyCNoiuCap8m0BYUde0wiiuP8k1cXmTpKN0",
  authDomain: "foxglove-studio-testing.firebaseapp.com",
  projectId: "foxglove-studio-testing",
  storageBucket: "foxglove-studio-testing.appspot.com",
  messagingSenderId: "667544771216",
  appId: "1:667544771216:web:f8e6d9705a3c28e73a5615",
};

export default function App(props: AppProps): JSX.Element {
  const globalStore = getGlobalStore();
  const firebaseApp = useMemo(() => initializeApp(firebaseConfig), []);

  const [assetLoaders] = useState(() => [new URDFAssetLoader()]);

  const providers = [
    /* eslint-disable react/jsx-key */
    // FIXME: do firebase providers belong in app or web/desktop?
    <FirebaseAppContext.Provider value={firebaseApp} />,
    <FirebaseLoginProvider />,

    <AnalyticsProvider />,
    <ModalHost />, // render modal elements inside the ThemeProvider
    <StudioToastProvider />,
    <AssetsProvider loaders={assetLoaders} />,
    <ReduxProvider store={globalStore} />,
    <CurrentLayoutProvider />,
    <PlayerManager playerSources={props.availableSources} />,
    <ExtensionsProvider />,
    /* eslint-enable react/jsx-key */
  ];

  return (
    <MultiProvider providers={providers}>
      <NativeFileMenuPlayerSelection />
      <DndProvider backend={HTML5Backend}>
        <Suspense fallback={<></>}>
          <BuiltinPanelCatalogProvider>
            <Workspace
              demoBagUrl={props.demoBagUrl}
              deepLinks={props.deepLinks}
              onToolbarDoubleClick={props.onFullscreenToggle}
            />
          </BuiltinPanelCatalogProvider>
        </Suspense>
      </DndProvider>
    </MultiProvider>
  );
}
