// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { StrictMode, useMemo } from "react";
import { useSelector } from "react-redux";

import { SidebarContent } from "@foxglove-studio/app/components/SidebarContent";
import { usePanelCatalog } from "@foxglove-studio/app/context/PanelCatalogContext";
import { PanelIdContext } from "@foxglove-studio/app/context/PanelIdContext";
import { State } from "@foxglove-studio/app/reducers";
import { getPanelTypeFromId } from "@foxglove-studio/app/util/layout";

import SchemaEditor from "./SchemaEditor";

export default function PanelSettings(): JSX.Element {
  const selectedPanelId = useSelector((state: State) =>
    state.mosaic.selectedPanelIds.length === 1 ? state.mosaic.selectedPanelIds[0] : undefined,
  );

  const panelCatalog = usePanelCatalog();
  const panelInfo = useMemo(
    () =>
      selectedPanelId != undefined
        ? panelCatalog.getPanelsByType().get(getPanelTypeFromId(selectedPanelId))
        : undefined,
    [panelCatalog, selectedPanelId],
  );
  if (selectedPanelId == undefined) {
    return (
      <SidebarContent title={`Panel Settings`}>Select a panel to edit its settings.</SidebarContent>
    );
  }
  if (!panelInfo) {
    throw new Error(
      `Attempt to render settings but no panel component could be found for panel id ${selectedPanelId}`,
    );
  }
  if (!panelInfo.component.configSchema) {
    return (
      <SidebarContent title={panelInfo.title}>
        This panel does not provide any settings.
      </SidebarContent>
    );
  }

  return (
    <SidebarContent title={panelInfo.title}>
      <StrictMode>
        <PanelIdContext.Provider value={selectedPanelId}>
          <SchemaEditor configSchema={panelInfo.component.configSchema} />
        </PanelIdContext.Provider>
      </StrictMode>
    </SidebarContent>
  );
}
