// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  Callout,
  ColorPicker,
  DefaultButton,
  DirectionalHint,
  Dropdown,
  IColorPickerStyles,
  Label,
  Stack,
  TextField,
  Toggle,
} from "@fluentui/react";
import { useRef, useState } from "react";

import { useConfig } from "@foxglove-studio/app/PanelAPI";
import { PanelConfigSchemaEntry } from "@foxglove-studio/app/types/panels";
import Logger from "@foxglove/log";

const log = Logger.getLogger(__filename);

const COLOR_PICKER_STYLES: IColorPickerStyles = {
  root: { maxWidth: 250 },
  colorRectangle: { minWidth: 100, minHeight: 100 },
  table: {
    // We need to remove table styles from global.scss, but for now, changing them
    // to e.g. "#root td" messes with the styling in various places because the
    // selector becomes more specific. So for now, just disable them directly here.
    "tr, th, td, tr:hover th, tr:hover td": {
      border: "none",
      background: "none",
      cursor: "unset",
    },
  },
};

export default function SchemaEntryEditor({
  entry,
}: {
  entry: PanelConfigSchemaEntry;
}): JSX.Element {
  const [config, saveConfig] = useConfig<Record<string, unknown>>();
  const { key, title } = entry;
  const currentValue = config[key];
  const [colorPickerShown, setColorPickerShown] = useState(false);
  const colorButtonRef = useRef<HTMLElement>(ReactNull);

  switch (entry.type) {
    case "text": {
      let value;
      if (typeof currentValue === "string") {
        value = currentValue;
      } else {
        value = "";
        log.warn(`Unexpected type for ${key}:`, currentValue);
      }
      return (
        <TextField
          label={title}
          placeholder={entry.placeholder}
          value={value}
          onChange={(_event, newValue) => saveConfig({ [key]: newValue })}
        />
      );
    }

    case "toggle": {
      if (currentValue != undefined && typeof currentValue !== "boolean") {
        log.warn(`Unexpected type for ${key}:`, currentValue);
      }
      return (
        <Toggle
          label={title}
          checked={!!currentValue}
          onChange={(_event, checked) => saveConfig({ [key]: checked })}
        />
      );
    }

    case "dropdown": {
      let selectedKey;
      if (typeof currentValue === "string" || typeof currentValue === "number") {
        selectedKey = currentValue;
      } else {
        log.warn(`Unexpected type for ${key}:`, currentValue);
        selectedKey = undefined;
      }
      return (
        <Dropdown
          label={title}
          selectedKey={selectedKey}
          onChange={(_event, _value, index) => {
            if (index != undefined) {
              saveConfig({ [key]: entry.options[index]?.value });
            }
          }}
          options={entry.options.map(({ value, text }) => ({ key: value, text }))}
        />
      );
    }

    case "color": {
      let value: string;
      if (typeof currentValue === "string") {
        value = currentValue;
      } else {
        log.warn(`Unexpected type for ${key}:`, currentValue);
        value = "";
      }
      return (
        <Stack.Item>
          <Label>{title}</Label>
          <DefaultButton
            elementRef={colorButtonRef}
            styles={{
              root: { backgroundColor: value },
              rootHovered: { backgroundColor: value, opacity: 0.8 },
              rootPressed: { backgroundColor: value, opacity: 0.6 },
            }}
            onClick={() => setColorPickerShown(!colorPickerShown)}
          />
          {colorPickerShown && (
            <Callout
              directionalHint={DirectionalHint.rightCenter}
              target={colorButtonRef.current}
              onDismiss={() => setColorPickerShown(false)}
            >
              <ColorPicker
                color={value}
                alphaType="none"
                onChange={(_event, newValue) => saveConfig({ [key]: `#${newValue.hex}` })}
                styles={COLOR_PICKER_STYLES}
              />
            </Callout>
          )}
        </Stack.Item>
      );
    }
  }
  throw new Error(
    `Unsupported type ${(entry as PanelConfigSchemaEntry).type} in panel config schema`,
  );
}
