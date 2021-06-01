// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useLayoutEffect, useRef } from "react";

import Panel from "@foxglove/studio-base/components/Panel";
import PanelToolbar from "@foxglove/studio-base/components/PanelToolbar";

class Sample {
  foo() {
    console.log("bar");
  }
}

function IframePanel() {
  const iframeRef = useRef<HTMLIFrameElement>(ReactNull);

  useLayoutEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) {
      return;
    }

    if (!iframe.contentWindow) {
      return;
    }
    console.log("setting studio value");

    const sample = new Sample();
    (iframe.contentWindow as any)["__studio"] = sample;
  }, []);

  return (
    <>
      <PanelToolbar />
      <iframe ref={iframeRef} src="extension.html" />
    </>
  );
}

IframePanel.panelType = "iframe";
IframePanel.defaultConfig = {};
IframePanel.supportsStrictMode = true;

export default Panel(IframePanel);
