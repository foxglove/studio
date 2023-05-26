// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { StrictMode, useMemo } from "react";
import ReactDOM from "react-dom";

import { useCrash } from "@foxglove/hooks";
import { PanelExtensionContext } from "@foxglove/studio";
import { CaptureErrorBoundary } from "@foxglove/studio-base/components/CaptureErrorBoundary";
import {
  ForwardContextProviders,
  ForwardedContexts,
  useForwardContext,
} from "@foxglove/studio-base/components/ForwardContextProviders";
import Panel from "@foxglove/studio-base/components/Panel";
import { PanelExtensionAdapter } from "@foxglove/studio-base/components/PanelExtensionAdapter";
import AnalyticsContext from "@foxglove/studio-base/context/AnalyticsContext";
import { SaveConfig } from "@foxglove/studio-base/types/panels";

import { defaultConfig, ImageView } from "./ImageView";
import { Config } from "./types";

function initPanel(
  crash: ReturnType<typeof useCrash>,
  forwardedContexts: ForwardedContexts,
  context: PanelExtensionContext,
) {
  ReactDOM.render(
    <StrictMode>
      <CaptureErrorBoundary onError={crash}>
        <ForwardContextProviders contexts={forwardedContexts}>
          <ImageView context={context} />
        </ForwardContextProviders>
      </CaptureErrorBoundary>
    </StrictMode>,
    context.panelElement,
  );
  return () => {
    ReactDOM.unmountComponentAtNode(context.panelElement);
  };
}

type Props = {
  config: Config;
  saveConfig: SaveConfig<Config>;
};

function ImagePanelAdapter(props: Props) {
  const crash = useCrash();
  const forwardedAnalytics = useForwardContext(AnalyticsContext);
  const forwardedContexts = useMemo(() => new Map([forwardedAnalytics]), [forwardedAnalytics]);
  const boundInitPanel = useMemo(
    () => initPanel.bind(undefined, crash, forwardedContexts),
    [crash, forwardedContexts],
  );

  return (
    <PanelExtensionAdapter
      config={props.config}
      saveConfig={props.saveConfig}
      initPanel={boundInitPanel}
      highestSupportedConfigVersion={1}
    />
  );
}

ImagePanelAdapter.panelType = "ImageViewPanel";
ImagePanelAdapter.defaultConfig = defaultConfig;

export default Panel(ImagePanelAdapter);
