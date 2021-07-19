// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { init as initSentry } from "@sentry/browser";
import { useState } from "react";
import ReactDOM from "react-dom";
import styled from "styled-components";

import Logger from "@foxglove/log";

import "@foxglove/studio-base/styles/global.scss";

const log = Logger.getLogger(__filename);
const MINIMUM_CHROME_VERSION = 91;
const StyledBanner = styled.div`
  text-align: center;
  position: absolute;
  top: 0px;
  left: 0px;
  width: 100vw;
  padding: 10px;
  background-color: rgba(99, 102, 241, 0.9);
  z-index: 100;
`;

const VersionBanner = function ({ isChrome }: { isChrome: boolean }) {
  const [showBanner, setShowBanner] = useState(true);

  if (!showBanner) {
    return ReactNull;
  }

  const prompt = isChrome
    ? `Update Chrome to version ${MINIMUM_CHROME_VERSION}+ to continue.`
    : `You're using an unsupported browser. Use Chrome ${MINIMUM_CHROME_VERSION}+ to continue.`;
  const fixText = isChrome ? "Update Chrome" : "Download Chrome";
  const continueText = isChrome
    ? "Continue with unsupported version"
    : "Continue with unsupported browser";

  return (
    <StyledBanner>
      <div>
        <p>{prompt} </p>
        {isChrome ? undefined : (
          <p>
            Check out our browser support progress in{" "}
            <a href="https://github.com/foxglove/studio/issues/1422">this GitHub issue</a>.
          </p>
        )}
      </div>

      <div style={{ paddingTop: "20px" }}>
        <a href="https://www.google.com/chrome/" target="_blank" rel="noreferrer">
          <button>{fixText}</button>
        </a>
        <button onClick={() => setShowBanner(false)}>{continueText}</button>
      </div>
    </StyledBanner>
  );
};

log.debug("initializing");

if (typeof process.env.SENTRY_DSN === "string") {
  log.info("initializing Sentry");
  initSentry({
    dsn: process.env.SENTRY_DSN,
    autoSessionTracking: true,
    // Remove the default breadbrumbs integration - it does not accurately track breadcrumbs and
    // creates more noise than benefit.
    integrations: (integrations) => {
      return integrations.filter((integration) => {
        return integration.name !== "Breadcrumbs";
      });
    },
    maxBreadcrumbs: 10,
  });
}

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("missing #root element");
}

async function main() {
  const chromeMatch = navigator.userAgent.match(/Chrome\/(\d+)\./);
  const chromeVersion = chromeMatch ? parseInt(chromeMatch[1] ?? "", 10) : 0;
  const isChrome = chromeVersion !== 0;

  if (!isChrome) {
    ReactDOM.render(
      <>
        <VersionBanner isChrome={false} />
      </>,
      rootEl,
      () => {
        // Integration tests look for this console log to indicate the app has rendered once
        log.debug("App rendered");
      },
    );
    return;
  }

  const { installDevtoolsFormatters, overwriteFetch, waitForFonts } = await import(
    "@foxglove/studio-base"
  );
  installDevtoolsFormatters();
  overwriteFetch();
  // consider moving waitForFonts into App to display an app loading screen
  await waitForFonts();

  const { Root } = await import("./Root");
  if (chromeVersion >= MINIMUM_CHROME_VERSION) {
    ReactDOM.render(<Root />, rootEl, () => {
      // Integration tests look for this console log to indicate the app has rendered once
      log.debug("App rendered");
    });
    return;
  }

  ReactDOM.render(
    <>
      <VersionBanner isChrome={true} />
      <Root />
    </>,
    rootEl,
    () => {
      // Integration tests look for this console log to indicate the app has rendered once
      log.debug("App rendered");
    },
  );
}

void main();
