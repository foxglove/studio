// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

/// <reference types="quicklookjs" />

import ReactDOM from "react-dom";
import { createGlobalStyle } from "styled-components";

import Logger from "@foxglove/log";

import Root from "./Root";

const log = Logger.getLogger(__filename);

log.debug("initializing quicklook");

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("missing #root element");
}

const GlobalStyle = createGlobalStyle`
  body,
  html {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    padding: 0;
    margin: 0;
  }
  body {
    padding: 10px;
    font-family: ui-sans-serif, -apple-system;
  }
  table {
    width: 100%;
    max-width: 100%;
    word-break: break-word;
  }
  #file-input-trigger {
    position: absolute;
    display: block;
    margin: 0;
    padding: 0;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  }
`;

ReactDOM.render(
  <>
    <GlobalStyle />
    <Root />
  </>,
  rootEl,
);
