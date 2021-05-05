// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Checkbox, Dropdown } from "@fluentui/react";

import { useConfig } from "@foxglove-studio/app/PanelAPI";
import { PanelConfigSchemaEntry } from "@foxglove-studio/app/types/panels";
import Logger from "@foxglove/log";

const log = Logger.getLogger(__filename);

export default function SchemaEntryEditor({
  entry,
}: {
  entry: PanelConfigSchemaEntry;
}): JSX.Element {
  const [config, saveConfig] = useConfig<Record<string, unknown>>();
  const { configKey, title } = entry;
  const currentValue = config[configKey];

  switch (entry.type) {
    case "checkbox":
      if (currentValue != undefined && typeof currentValue !== "boolean") {
        log.warn(`Unexpected type for ${configKey} checkbox:`, currentValue);
      }
      return (
        <Checkbox
          label={title}
          checked={!!currentValue}
          onChange={(_event, checked) => saveConfig({ [configKey]: checked })}
        />
      );

    case "dropdown": {
      let selectedKey;
      if (typeof currentValue === "string" || typeof currentValue === "number") {
        selectedKey = currentValue;
        log.warn(`Unexpected type for ${configKey} dropdown:`, currentValue);
      } else {
        selectedKey = undefined;
      }
      return (
        <Dropdown
          label={title}
          selectedKey={selectedKey}
          onChange={(_event, _value, index) => {
            if (index != undefined) {
              saveConfig({ [configKey]: entry.options[index]?.value });
            }
          }}
          options={entry.options.map(({ value, text }) => ({ key: value, text }))}
        />
      );
    }
  }
  throw new Error(
    `Unsupported type ${(entry as PanelConfigSchemaEntry).type} in panel config schema`,
  );
}
