// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { StrictMode, useMemo } from "react";
import { useSelector } from "react-redux";

import { usePanelCatalog } from "@foxglove-studio/app/context/PanelCatalogContext";
import { PanelIdContext } from "@foxglove-studio/app/context/PanelIdContext";
import { State } from "@foxglove-studio/app/reducers";
import { getPanelTypeFromId } from "@foxglove-studio/app/util/layout";

export default function PanelSettings(): JSX.Element {
  const selectedPanelId = useSelector((state: State) =>
    state.mosaic.selectedPanelIds.length === 1 ? state.mosaic.selectedPanelIds[0] : undefined,
  );

  const panelCatalog = usePanelCatalog();
  const panelComponent = useMemo(
    () =>
      selectedPanelId != undefined
        ? panelCatalog.getComponentForType(getPanelTypeFromId(selectedPanelId))
        : undefined,
    [panelCatalog, selectedPanelId],
  );
  if (selectedPanelId == undefined) {
    return <>Select a panel to edit its settings.</>;
  }
  if (!panelComponent) {
    throw new Error(
      `Attempt to render settings but no panel component could be found for panel id ${selectedPanelId}`,
    );
  }
  if (!panelComponent.Settings) {
    return <>This panel does not provide any settings.</>;
  }
  return (
    <div>
      Settings for {selectedPanelId}:
      <StrictMode>
        <PanelIdContext.Provider value={selectedPanelId}>
          <panelComponent.Settings />
        </PanelIdContext.Provider>
      </StrictMode>
    </div>
  );
}
