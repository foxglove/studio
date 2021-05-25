// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useMemo } from "react";

import Panel from "@foxglove/studio-base/components/Panel";
import PanelToolbar from "@foxglove/studio-base/components/PanelToolbar";
import { useExtensionRegistry } from "@foxglove/studio-base/context/ExtensionRegistryContext";

const FullPanelId = "builtin.map";

function MapPanel(): JSX.Element {
  const registry = useExtensionRegistry();

  const PanelComponent = useMemo(() => {
    const panelRegistration = registry.getRegisteredPanel(FullPanelId);
    return panelRegistration?.registration.component;
  }, [registry]);

  if (!PanelComponent) {
    return (
      <>
        <PanelToolbar floating />
      </>
    );
  }

  return (
    <>
      <PanelToolbar floating />
      <PanelComponent />
    </>
  );
}

MapPanel.panelType = "map";
MapPanel.defaultConfig = {};
MapPanel.supportsStrictMode = false;

export default Panel(MapPanel);
