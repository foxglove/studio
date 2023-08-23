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

import { MenuItem, Paper, Select } from "@mui/material";
import { useCallback } from "react";
import { makeStyles } from "tss-react/mui";

import { Immutable } from "@foxglove/studio";
import CopyButton from "@foxglove/studio-base/components/CopyButton";
import { FilterTagInput } from "@foxglove/studio-base/panels/Log/FilterTagInput";
import useLogStyles from "@foxglove/studio-base/panels/Log/useLogStyles";

import LevelToString from "./LevelToString";
import { LogLevel, NormalizedLogMessage } from "./types";

// Create the log level options nodes once since they don't change per render.
const LOG_LEVEL_OPTIONS = [
  { text: ">= DEBUG", key: LogLevel.DEBUG },
  { text: ">= INFO", key: LogLevel.INFO },
  { text: ">= WARN", key: LogLevel.WARN },
  { text: ">= ERROR", key: LogLevel.ERROR },
  { text: ">= FATAL", key: LogLevel.FATAL },
];

const useStyles = makeStyles()((theme) => ({
  root: {
    display: "flex",
    padding: theme.spacing(0.75),
    gap: theme.spacing(0.5),
    alignItems: "flex-end",
  },
  button: {
    flex: "none",
  },
  select: {
    minWidth: 100,
  },
}));

export type Filter = {
  minLogLevel: number;
  searchTerms: string[];
};

export type FilterBarProps = Immutable<{
  searchTerms: Set<string>;
  nodeNames: Set<string>;
  minLogLevel: number;
  messages: NormalizedLogMessage[];

  onFilterChange: (filter: Filter) => void;
}>;

export function FilterBar(props: FilterBarProps): JSX.Element {
  const { classes: logStyles } = useLogStyles();
  const { classes, cx } = useStyles();

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
    const className = logLevelToClass(option.key);
    return (
      <MenuItem key={index} value={option.key} className={className}>
        {option.text}
      </MenuItem>
    );
  });

  const renderLogLevelValue = useCallback(
    (value: number) => {
      const option = LOG_LEVEL_OPTIONS.find((o) => o.key === value);
      const className = logLevelToClass(Number(option?.key ?? LogLevel.DEBUG));
      return <div className={className}>{option?.text}</div>;
    },
    [logLevelToClass],
  );

  return (
    <Paper square className={classes.root}>
      <Select
        className={classes.select}
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
      <FilterTagInput
        items={[...props.searchTerms]}
        suggestions={[...props.nodeNames]}
        onChange={(items: string[]) => {
          props.onFilterChange({
            minLogLevel: props.minLogLevel,
            searchTerms: items,
          });
        }}
      />
      <CopyButton
        size="small"
        getText={() => JSON.stringify(props.messages, undefined, 2) ?? ""}
        className={classes.button}
      />
    </Paper>
  );
}
