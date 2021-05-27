// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useCallback, useMemo } from "react";

import { panel } from "@foxglove/studio";
import {
  useCurrentLayoutActions,
  useCurrentLayoutSelector,
} from "@foxglove/studio-base/context/CurrentLayoutContext";
import { usePanelId } from "@foxglove/studio-base/context/PanelIdContext";
import { SaveConfig } from "@foxglove/studio-base/types/panels";

/**
 * Mix partial panel config from savedProps with the panel type's `defaultConfig` to form the complete panel configuration.
 */
export const useConfig: typeof panel.useConfig = <Config>(defaultValue: Config) => {
  const panelId = usePanelId();
  return useConfigById(panelId, defaultValue);
};

/**
 * Like `useConfig`, but for a specific panel id. This generally shouldn't be used by panels
 * directly, but is for use in internal code that's running outside of a PanelIdContext.
 */
export function useConfigById<Config>(
  panelId: string | undefined,
  defaultConfig: Config | undefined,
): [Config, SaveConfig<Config>] {
  const { savePanelConfigs } = useCurrentLayoutActions();
  const config = useCurrentLayoutSelector((state) =>
    panelId != undefined ? (state.configById[panelId] as Config | undefined) : undefined,
  );
  if (panelId != undefined && !defaultConfig) {
    throw new Error(`Attempt to useConfig() but panel ${panelId} has no defaultConfig`);
  }

  const saveConfig: SaveConfig<Config> = useCallback(
    (newConfig) => {
      if (panelId != undefined && defaultConfig != undefined) {
        savePanelConfigs({
          configs: [{ id: panelId, config: newConfig, defaultConfig }],
        });
      }
    },
    [panelId, defaultConfig, savePanelConfigs],
  );

  const mergedConfig = useMemo(
    () => ({ ...(defaultConfig as Config), ...config }),
    [defaultConfig, config],
  );

  return [mergedConfig, saveConfig];
}
