// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { StrictMode, useCallback, useState } from "react";
import { Component, PropsWithChildren, ReactNode } from "react";
import ReactDOM from "react-dom";

import { PanelExtensionContext } from "@foxglove/studio";
import Panel from "@foxglove/studio-base/components/Panel";
import { PanelExtensionAdapter } from "@foxglove/studio-base/components/PanelExtensionAdapter";
import { SaveConfig } from "@foxglove/studio-base/types/panels";

import { ThreeDeeRender } from "./ThreeDeeRender";

type RethrowErrorBoundaryProps = {
  onError: (err: Error) => void;
};

/** An error boundary that calls an onError function when it captures an error */
class RethrowErrorBoundary extends Component<
  PropsWithChildren<RethrowErrorBoundaryProps>,
  unknown
> {
  public override componentDidCatch(error: Error): void {
    this.props.onError(error);
  }

  public override render(): ReactNode {
    return this.props.children;
  }
}

/**
 * useCrash returns a function you can call with an error that was thrown outside of react into the
 * react tree for an error boundary to handle it.
 *
 * See: https://reactjs.org/docs/error-boundaries.html#how-about-event-handlers
 */
function useCrash() {
  const [, setError] = useState<Error | undefined>();
  return useCallback(
    (err: Error) =>
      // Trick to throw in the set function will make the error catchable by an error boundary
      setError(() => {
        throw err;
      }),
    [],
  );
}

function initPanel(crash: (err: Error) => void, context: PanelExtensionContext) {
  ReactDOM.render(
    <StrictMode>
      <RethrowErrorBoundary onError={crash}>
        <ThreeDeeRender context={context} />
      </RethrowErrorBoundary>
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
