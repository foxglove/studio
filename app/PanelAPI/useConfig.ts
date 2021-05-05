// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DeepReadonly } from "ts-essentials";

import { savePanelConfigs } from "@foxglove-studio/app/actions/panels";
import { usePanelCatalog } from "@foxglove-studio/app/context/PanelCatalogContext";
import { usePanelId } from "@foxglove-studio/app/context/PanelIdContext";
import { State } from "@foxglove-studio/app/reducers";
import { SaveConfig } from "@foxglove-studio/app/types/panels";
import { getPanelTypeFromId } from "@foxglove-studio/app/util/layout";

export function useConfig<Config>(): [DeepReadonly<Config>, SaveConfig<Config>] {
  const panelId = usePanelId();
  const config = useSelector(
    (state: State) => state.persistedState.panels.savedProps[panelId] as Config | undefined,
  );
  const panelCatalog = usePanelCatalog();
  const panelComponent = useMemo(
    () => panelCatalog.getComponentForType(getPanelTypeFromId(panelId)),
    [panelCatalog, panelId],
  );
  if (!panelComponent) {
    throw new Error(`Attempt to useConfig() with unknown panel id ${panelId}`);
  }
  if (!panelComponent.defaultConfig) {
    throw new Error(
      `Attempt to useConfig() but panel component ${
        panelComponent.displayName ?? panelComponent.name
      } has no defaultConfig`,
    );
  }

  const dispatch = useDispatch();

  const saveConfig: SaveConfig<Config> = useCallback(
    (newConfig) => {
      dispatch(
        savePanelConfigs({
          configs: [
            { id: panelId, config: newConfig, defaultConfig: panelComponent.defaultConfig },
          ],
        }),
      );
    },
    [dispatch, panelComponent.defaultConfig, panelId],
  );

  return [config ?? panelComponent.defaultConfig, saveConfig];
}
