// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useLayoutEffect, useState } from "react";
import ReactDOM from "react-dom";

import { PanelExtensionContext } from "@foxglove/studio";
import Panel from "@foxglove/studio-base/components/Panel";
import PanelExtensionAdapter from "@foxglove/studio-base/components/PanelExtensionAdapter";
import ThemeProvider from "@foxglove/studio-base/theme/ThemeProvider";
import { SaveConfig } from "@foxglove/studio-base/types/panels";

import TeleopPanel from "./TeleopPanel";
import helpContent from "./index.help.md";

function ExtensionThemeProvider({
  context,
  children,
}: React.PropsWithChildren<{ context: PanelExtensionContext }>) {
  const [scheme, setScheme] = useState(context.initialColorScheme);
  useLayoutEffect(() => {
    context.onColorSchemeChange = setScheme;
  }, [context]);
  return <ThemeProvider isDark={scheme === "dark"}>{children}</ThemeProvider>;
}

function initPanel(context: PanelExtensionContext) {
  ReactDOM.render(
    <ExtensionThemeProvider context={context}>
      <TeleopPanel context={context} />
    </ExtensionThemeProvider>,
    context.panelElement,
  );
}

type Props = {
  config: unknown;
  saveConfig: SaveConfig<unknown>;
};

function TeleopPanelAdapter(props: Props) {
  return (
    <PanelExtensionAdapter
      config={props.config}
      saveConfig={props.saveConfig}
      help={helpContent}
      initPanel={initPanel}
    />
  );
}

TeleopPanelAdapter.panelType = "Teleop";
TeleopPanelAdapter.defaultConfig = {};
TeleopPanelAdapter.supportsStrictMode = true;

export default Panel(TeleopPanelAdapter);
