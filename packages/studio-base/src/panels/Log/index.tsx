// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useMemo } from "react";

import { useCrash } from "@foxglove/hooks";
import Panel from "@foxglove/studio-base/components/Panel";
import { PanelExtensionAdapter } from "@foxglove/studio-base/components/PanelExtensionAdapter";
import { SaveConfig } from "@foxglove/studio-base/types/panels";

import { initPanel } from "./initPanel";
import { Config } from "./types";

type Props = {
  config: unknown;
  saveConfig: SaveConfig<unknown>;
};

function MapPanelAdapter(props: Props) {
  const crash = useCrash();
  const boundInitPanel = useMemo(() => initPanel.bind(undefined, crash), [crash]);

  return (
    <PanelExtensionAdapter
      config={props.config}
      saveConfig={props.saveConfig}
      initPanel={boundInitPanel}
      highestSupportedConfigVersion={1}
    />
  );
}

MapPanelAdapter.panelType = "RosOut";
MapPanelAdapter.defaultConfig = { searchTerms: [], minLogLevel: 1 } satisfies Config;

export default Panel(MapPanelAdapter);
