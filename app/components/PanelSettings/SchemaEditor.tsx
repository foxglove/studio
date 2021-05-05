// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Stack, useTheme } from "@fluentui/react";

import { PanelConfigSchema } from "@foxglove-studio/app/types/panels";

import SchemaEntryEditor from "./SchemaEntryEditor";

export default function SchemaEditor({
  configSchema,
}: {
  configSchema: PanelConfigSchema<string>;
}): JSX.Element {
  const theme = useTheme();
  return (
    <Stack tokens={{ childrenGap: theme.spacing.m }}>
      {configSchema.map((entry) => (
        <SchemaEntryEditor key={entry.key} entry={entry} />
      ))}
    </Stack>
  );
}
