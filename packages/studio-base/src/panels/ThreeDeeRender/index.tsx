// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { StrictMode } from "react";
import ReactDOM from "react-dom";

import { useCrash } from "@foxglove/hooks";
import { PanelExtensionContext } from "@foxglove/studio";
import { CaptureErrorBoundary } from "@foxglove/studio-base/components/CaptureErrorBoundary";
import Panel from "@foxglove/studio-base/components/Panel";
import { PanelExtensionAdapter } from "@foxglove/studio-base/components/PanelExtensionAdapter";
import { SaveConfig } from "@foxglove/studio-base/types/panels";

import { ThreeDeeRender } from "./ThreeDeeRender";

function initPanel(crash: ReturnType<typeof useCrash>, context: PanelExtensionContext) {
  ReactDOM.render(
    <StrictMode>
      <CaptureErrorBoundary onError={crash}>
        <ThreeDeeRender context={context} />
      </CaptureErrorBoundary>
    </StrictMode>,
    context.panelElement,
  );
  return () => {
    ReactDOM.unmountComponentAtNode(context.panelElement);
  };
}

type Props = {
  config: unknown;
  saveConfig: SaveConfig<unknown>;
};

function ThreeDeeRenderAdapter(props: Props) {
  const crash = useCrash();

  return (
    <PanelExtensionAdapter
      config={props.config}
      saveConfig={props.saveConfig}
      initPanel={initPanel.bind(undefined, crash)}
    />
  );
}

ThreeDeeRenderAdapter.panelType = "3D";
ThreeDeeRenderAdapter.defaultConfig = {};

export default Panel(ThreeDeeRenderAdapter);
