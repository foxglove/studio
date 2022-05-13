// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { SettingsTreeNode } from "@foxglove/studio-base/components/SettingsTreeEditor/types";
import { RawMessagesConfig } from "@foxglove/studio-base/panels/RawMessages";

export function buildSettingsTree(config: RawMessagesConfig): SettingsTreeNode {
  return {
    fields: {
      expansionMode: {
        label: "Expand Fields",
        input: "select",
        value: config.expansionMode,
        options: [
          { label: "Manual", value: "manual" },
          { label: "Smart", value: "smart" },
          { label: "All", value: "all" },
        ],
      },
    },
  };
}
