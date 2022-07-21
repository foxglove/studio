// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Global, css } from "@emotion/react";

export function GlobalStyle(): JSX.Element {
  return (
    <Global
      styles={css`
        * {
          box-sizing: border-box;
        }
        body,
        html {
          width: 100%;
          height: 100%;
          padding: 0;
          margin: 0;

          @media (prefers-color-scheme: dark) {
            background: #333;
          }
        }
        body {
          padding: 10px !important; // important for Storybook
          min-width: 150px;
          font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, sans-serif;

          @media (prefers-color-scheme: dark) {
            color: #fff;
          }
        }
        pre,
        code,
        tt {
          font-family: ui-monospace, Menlo, Monaco, monospace;
        }
        a {
          color: #476ebd;

          @media (prefers-color-scheme: dark) {
            color: #99b5ed;
          }
        }
      `}
    />
  );
}
