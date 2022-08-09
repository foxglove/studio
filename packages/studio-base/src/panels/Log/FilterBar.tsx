// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
//
// This file incorporates work covered by the following copyright and
// permission notice:
//
//   Copyright 2018-2021 Cruise LLC
//
//   This source code is licensed under the Apache License, Version 2.0,
//   found at http://www.apache.org/licenses/LICENSE-2.0
//   You may not use this file except in compliance with the License.

import { TagPicker } from "@fluentui/react";
import CopyAllIcon from "@mui/icons-material/CopyAll";
import { MenuItem, Select, useTheme as useMuiTheme } from "@mui/material";
import { useCallback } from "react";

import ToolbarIconButton from "@foxglove/studio-base/components/PanelToolbar/ToolbarIconButton";
import Stack from "@foxglove/studio-base/components/Stack";
import useLogStyles from "@foxglove/studio-base/panels/Log/useLogStyles";
import clipboard from "@foxglove/studio-base/util/clipboard";

import LevelToString from "./LevelToString";
import { LogMessageEvent, LogLevel } from "./types";

// Create the log level options nodes once since they don't change per render.
const LOG_LEVEL_OPTIONS = [
  { text: ">= DEBUG", key: LogLevel.DEBUG },
  { text: ">= INFO", key: LogLevel.INFO },
  { text: ">= WARN", key: LogLevel.WARN },
  { text: ">= ERROR", key: LogLevel.ERROR },
  { text: ">= FATAL", key: LogLevel.FATAL },
];

type Filter = {
  minLogLevel: number;
  searchTerms: string[];
};

export type FilterBarProps = {
  searchTerms: Set<string>;
  nodeNames: Set<string>;
  minLogLevel: number;
  messages: readonly LogMessageEvent[];

  onFilterChange: (filter: Filter) => void;
};

export default function FilterBar(props: FilterBarProps): JSX.Element {
  const { classes: logStyles, cx } = useLogStyles();
  const nodeNameOptions = Array.from(props.nodeNames, (name) => ({ name, key: name }));

  const selectedItems = Array.from(props.searchTerms, (term) => ({
    name: term,
    key: term,
  }));
  const muiTheme = useMuiTheme();

  const logLevelToClass = useCallback(
    (level: number) => {
      const strLevel = LevelToString(level);
      return cx({
        [logStyles.fatal]: strLevel === "FATAL",
        [logStyles.error]: strLevel === "ERROR",
        [logStyles.warn]: strLevel === "WARN",
        [logStyles.info]: strLevel === "INFO",
        [logStyles.debug]: strLevel === "DEBUG",
      });
    },
    [cx, logStyles.debug, logStyles.error, logStyles.fatal, logStyles.info, logStyles.warn],
  );

  const logLevelItems = LOG_LEVEL_OPTIONS.map((option, index) => {
    const classes = logLevelToClass(option.key);
    return (
      <MenuItem key={index} value={option.key} className={classes}>
        {option.text}
      </MenuItem>
    );
  });

  const renderLogLevelValue = useCallback(
    (value: number) => {
      const option = LOG_LEVEL_OPTIONS.find((o) => o.key === value);
      const classes = logLevelToClass(Number(option?.key ?? LogLevel.DEBUG));
      return <div className={classes}>{option?.text}</div>;
    },
    [logLevelToClass],
  );

  return (
    <Stack
      flex="auto"
      direction="row"
      gap={0.5}
      alignItems="center"
      style={{ marginRight: muiTheme.spacing(-1) }} // Spacing hack until we can unify the toolbar items.
    >
      <Select
        value={props.minLogLevel}
        size="small"
        renderValue={renderLogLevelValue}
        onChange={(event) => {
          props.onFilterChange({
            minLogLevel: Number(event.target.value),
            searchTerms: Array.from(props.searchTerms),
          });
        }}
      >
        {logLevelItems}
      </Select>
      <Stack flex="auto" gap={1}>
        <TagPicker
          inputProps={{
            placeholder: "Search filter",
          }}
          styles={{
            text: { minWidth: 0, minHeight: 22 },
            input: {
              width: 0,
              height: 20,
              fontSize: 11,

              "::placeholder": {
                fontSize: 11,
              },
            },
            root: { height: 22 },
            itemsWrapper: {
              ".ms-TagItem": { lineHeight: 16, height: 16, fontSize: 11 },
              ".ms-TagItem-text": { margin: "0 4px" },
              ".ms-TagItem-close": {
                fontSize: 11,
                width: 20,

                ".ms-Button-icon": {
                  margin: 0,
                },
              },
            },
          }}
          removeButtonAriaLabel="Remove"
          selectionAriaLabel="Filter"
          resolveDelay={50}
          selectedItems={selectedItems}
          onResolveSuggestions={(filter: string) => {
            return [
              { name: filter, key: filter },
              ...nodeNameOptions.filter(({ key }) =>
                selectedItems.every((item) => item.key !== key),
              ),
            ];
          }}
          onChange={(items) => {
            props.onFilterChange({
              minLogLevel: props.minLogLevel,
              searchTerms: items?.map((item) => item.name) ?? [],
            });
          }}
        />
      </Stack>
      <Stack direction="row" alignItems="center" gap={0.5}>
        <ToolbarIconButton
          onClick={() => {
            void clipboard.copy(JSON.stringify(props.messages, undefined, 2) ?? "");
          }}
          title="Copy log to clipboard"
        >
          <CopyAllIcon />
        </ToolbarIconButton>
      </Stack>
    </Stack>
  );
}
