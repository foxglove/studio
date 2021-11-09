// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { on } from "@fluentui/utilities";

/**
 * Installs a window level handler to get ahead of FluentUI's global
 * dismiss on scroll behavior for Callouts, Dropdowns etc. This prevents
 * scroll events from auto-scrolling windows like the log from dismissing
 * open widgets.
 *
 * This should probably be considered to be a temporary woraround.
 */
export function useCalloutDismissalBlocker(): void {
  on(
    window,
    "scroll",
    (e) => {
      if (
        e.target instanceof HTMLElement &&
        e.target.classList.contains("ReactVirtualized__List")
      ) {
        e.stopImmediatePropagation();
      }
    },
    true,
  );
}
