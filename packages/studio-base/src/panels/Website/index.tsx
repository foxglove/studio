// (c) jk-ethz, https://github.com/jk-ethz
// All rights reserved.

import { StrictMode, useCallback, useState, useEffect } from "react";
import ReactDOM from "react-dom";

import { PanelExtensionContext, SettingsTreeAction } from "@foxglove/studio";
import Panel from "@foxglove/studio-base/components/Panel";
import { PanelExtensionAdapter } from "@foxglove/studio-base/components/PanelExtensionAdapter";
import { SaveConfig } from "@foxglove/studio-base/types/panels";

import { buildSettingsTree, WebsiteConfig } from "./config";
import helpContent from "./index.help.md";

function WebsitePanel(props: { context: PanelExtensionContext }): JSX.Element {
  const { context } = props;

  const [config, setConfig] = useState<WebsiteConfig>(() => {
    const initialConfig = context.initialState as Partial<WebsiteConfig>;
    return {
      url: initialConfig.url ?? "",
    };
  });

  const actionHandler = useCallback((action: SettingsTreeAction) => {
    if (action.action !== "update") {
      return;
    }

    const { path, input, value } = action.payload;
    if (path[1] === "url" && input === "string") {
      setConfig((oldConfig) => {
        return { ...oldConfig, url: String(value) };
      });
    }
  }, []);

  useEffect(() => {
    context.saveState(config);
  }, [context, config]);

  useEffect(() => {
    context.updatePanelSettingsEditor({
      actionHandler,
      nodes: buildSettingsTree(config),
    });
  }, [config, context, actionHandler]);

  return <>{!!config.url && <iframe·width="100%"·height="100%"·src={config.url}·/>}</>;
}

function initPanel(context: PanelExtensionContext) {
  ReactDOM.render(
    <StrictMode>
      <WebsitePanel context={context} />
    </StrictMode>,
    context.panelElement,
  );
}

type Props = {
  config: WebsiteConfig;
  saveConfig: SaveConfig<WebsiteConfig>;
};

function WebsitePanelAdapter(props: Props) {
  return (
    <PanelExtensionAdapter
      config={props.config}
      saveConfig={props.saveConfig}
      help={helpContent}
      initPanel={initPanel}
    />
  );
}

WebsitePanelAdapter.panelType = "website";
WebsitePanelAdapter.defaultConfig = {};

export default Panel(WebsitePanelAdapter);
