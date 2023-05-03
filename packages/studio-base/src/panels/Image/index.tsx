// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { StrictMode, useMemo } from "react";
import ReactDOM from "react-dom";

import { useCrash } from "@foxglove/hooks";
import { PanelExtensionContext } from "@foxglove/studio";
import { AppSetting } from "@foxglove/studio-base/AppSetting";
import { CaptureErrorBoundary } from "@foxglove/studio-base/components/CaptureErrorBoundary";
import Panel from "@foxglove/studio-base/components/Panel";
import { PanelExtensionAdapter } from "@foxglove/studio-base/components/PanelExtensionAdapter";
import { useAppConfigurationValue } from "@foxglove/studio-base/hooks/useAppConfigurationValue";
import { SaveConfig } from "@foxglove/studio-base/types/panels";

import { defaultConfig, ImageView } from "./ImageView";
import { Config } from "./types";

function initPanel(
  {
    crash,
    enableNewImagePanel,
  }: { crash: ReturnType<typeof useCrash>; enableNewImagePanel: boolean },
  context: PanelExtensionContext,
) {
  ReactDOM.render(
    <StrictMode>
      <CaptureErrorBoundary onError={crash}>
        <ImageView context={context} enableNewImagePanel={enableNewImagePanel} />
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
  const [enableNewImagePanel = false] = useAppConfigurationValue<boolean>(
    AppSetting.ENABLE_NEW_IMAGE_PANEL,
  );
  const boundInitPanel = useMemo(
    () => initPanel.bind(undefined, { crash, enableNewImagePanel }),
    [crash, enableNewImagePanel],
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
