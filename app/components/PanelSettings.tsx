// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Stack, Text, useTheme } from "@fluentui/react";
import { StrictMode, useMemo } from "react";
import { useSelector } from "react-redux";

import { usePanelCatalog } from "@foxglove-studio/app/context/PanelCatalogContext";
import { PanelIdContext } from "@foxglove-studio/app/context/PanelIdContext";
import { State } from "@foxglove-studio/app/reducers";
import { getPanelTypeFromId } from "@foxglove-studio/app/util/layout";

function Wrapper({ title, children }: React.PropsWithChildren<{ title: string }>): JSX.Element {
  const theme = useTheme();
  return (
    <Stack
      verticalFill
      style={{ padding: theme.spacing.m }}
      tokens={{ childrenGap: theme.spacing.s1 }}
    >
      <Text as="h2" variant="large">
        {title}
      </Text>
      <Stack.Item>{children}</Stack.Item>
    </Stack>
  );
}

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
    return <Wrapper title={`Panel Settings`}>Select a panel to edit its settings.</Wrapper>;
  }
  if (!panelInfo) {
    throw new Error(
      `Attempt to render settings but no panel component could be found for panel id ${selectedPanelId}`,
    );
  }
  if (!panelInfo.component.Settings) {
    return <Wrapper title={panelInfo.title}>This panel does not provide any settings.</Wrapper>;
  }
  return (
    <Wrapper title={`Settings for ${panelInfo.title}`}>
      <StrictMode>
        <PanelIdContext.Provider value={selectedPanelId}>
          <panelInfo.component.Settings />
        </PanelIdContext.Provider>
      </StrictMode>
    </Wrapper>
  );
}
