// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { ActionButton, Stack, TextField, useTheme } from "@fluentui/react";
import { useState, useMemo, useCallback, useLayoutEffect } from "react";

import {
  IDataSourceFactory,
  usePlayerSelection,
} from "@foxglove/studio-base/context/PlayerSelectionContext";

import View from "./View";

type ConnectionProps = {
  onBack?: () => void;
  onCancel?: () => void;
  availableSources: IDataSourceFactory[];
};

export default function Connection(props: ConnectionProps): JSX.Element {
  const { availableSources, onCancel, onBack } = props;

  const { selectSource } = usePlayerSelection();
  const theme = useTheme();
  const [selectedConnectionIdx, setSelectedConnectionIdx] = useState<number>(0);

  const availableSource = useMemo(
    () => availableSources[selectedConnectionIdx],
    [availableSources, selectedConnectionIdx],
  );

  const [fieldValues, setFieldValues] = useState<Record<string, string | undefined>>({});

  // clear field values when the user changes the source tab
  useLayoutEffect(() => {
    const defaultFieldValues: Record<string, string | undefined> = {};
    for (const field of availableSource?.formConfig?.fields ?? []) {
      if (field.defaultValue != undefined) {
        defaultFieldValues[field.id] = field.defaultValue;
      }
    }
    setFieldValues(defaultFieldValues);
  }, [availableSource]);

  const onOpen = useCallback(() => {
    if (!availableSource) {
      return;
    }
    selectSource(availableSource.id, { type: "connection", params: fieldValues });
  }, [availableSource, fieldValues, selectSource]);

  return (
    <View onBack={onBack} onCancel={onCancel} onOpen={onOpen}>
      <Stack grow verticalFill horizontal tokens={{ childrenGap: theme.spacing.l2 }}>
        <Stack
          verticalFill
          styles={{
            root: { marginLeft: `-${theme.spacing.s1}` },
          }}
        >
          {availableSources.map((source, idx) => {
            const { id, iconName, displayName } = source;
            return (
              <ActionButton
                checked={idx === selectedConnectionIdx}
                key={id}
                iconProps={{ iconName }}
                onClick={() => setSelectedConnectionIdx(idx)}
                styles={{
                  root: { minWidth: 240 },
                  rootChecked: { backgroundColor: theme.semanticColors.bodyBackgroundHovered },
                  iconChecked: { color: theme.palette.themePrimary },
                }}
              >
                {displayName}
              </ActionButton>
            );
          })}
        </Stack>
        <Stack
          grow
          verticalFill
          key={availableSource?.id}
          tokens={{ childrenGap: theme.spacing.m }}
        >
          {availableSource?.formConfig != undefined && (
            <Stack grow verticalAlign="space-between">
              <Stack tokens={{ childrenGap: theme.spacing.m }}>
                {availableSource?.formConfig.fields.map((field) => (
                  <TextField
                    key={field.label}
                    label={field.label}
                    placeholder={field.placeholder}
                    defaultValue={field.defaultValue}
                    onChange={(_, newValue) => {
                      setFieldValues((existing) => {
                        return {
                          ...existing,
                          [field.id]: newValue ?? field.defaultValue,
                        };
                      });
                    }}
                  />
                ))}
              </Stack>
            </Stack>
          )}
        </Stack>
      </Stack>
    </View>
  );
}
