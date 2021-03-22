// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import URL from "url-parse";

export function parseInputUrl(str?: string): string | undefined {
  if (str == undefined || str.length === 0) {
    return undefined;
  }
  if (str.indexOf("://") === -1) {
    str = `http://${str}`;
  }
  try {
    const url = new URL(str);
    return url.toString();
  } catch (e) {
    return undefined;
  }
}
