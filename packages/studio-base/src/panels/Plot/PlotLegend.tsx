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
import { makeStyles, Stack } from "@fluentui/react";
import AlertCircleIcon from "@mdi/svg/svg/alert-circle.svg";
import CloseIcon from "@mdi/svg/svg/close.svg";
import MenuIcon from "@mdi/svg/svg/menu.svg";
import cx from "classnames";
import { last } from "lodash";
import { useCallback } from "react";
import { MosaicNode } from "react-mosaic-component";
import tinycolor from "tinycolor2";

import Dropdown from "@foxglove/studio-base/components/Dropdown";
import DropdownItem from "@foxglove/studio-base/components/Dropdown/DropdownItem";
import Flex from "@foxglove/studio-base/components/Flex";
import Icon from "@foxglove/studio-base/components/Icon";
import MessagePathInput from "@foxglove/studio-base/components/MessagePathSyntax/MessagePathInput";
import { lineColors } from "@foxglove/studio-base/util/plotColors";
import { colors } from "@foxglove/studio-base/util/sharedStyleConstants";
import { TimestampMethod } from "@foxglove/studio-base/util/time";

import { PlotPath, BasePlotPath, isReferenceLinePlotPathType } from "./internalTypes";
import { plotableRosTypes, PlotConfig, PlotXAxisVal } from "./types";

const useStyles = makeStyles((theme) => ({
  root: {
    background: tinycolor(theme.palette.neutralLight).setAlpha(0.25).toRgbString(),
    color: theme.semanticColors.bodySubtext,
  },
  dropdown: {
    backgroundColor: "transparent !important",
    padding: "3px !important",
  },
  fullLengthButton: {
    background: tinycolor(theme.palette.neutralLight).setAlpha(0.5).toRgbString(),
    padding: 6,
    margin: 5,
    borderRadius: theme.effects.roundedCorner2,
    cursor: "pointer",
    textAlign: "center",

    ":hover": {
      background: tinycolor(theme.palette.neutralLight).setAlpha(0.75).toRgbString(),
    },
  },
  item: {
    display: "flex",
    padding: "0 5px",
    height: 20,
    lineHeight: 20,
    position: "relative",

    ":hover": {
      background: tinycolor(theme.palette.neutralLight).setAlpha(0.75).toRgbString(),

      "[data-item-remove]": {
        visibility: "initial",
      },
    },
  },
  itemIconContainer: {
    display: "inline-block",
    width: 22,
    height: 20,
    lineHeight: 0,
    cursor: "pointer",
    flexShrink: 0,

    ":hover": {
      background: theme.palette.neutralLight,
    },
  },
  itemIcon: {
    display: "inline-block",
    width: 15,
    borderBottom: "2px solid currentColor",
    height: 0,
    verticalAlign: "middle",
    position: "relative",
    top: "calc(50% - 1px)",
  },
  legendToggle: {
    padding: 6,
    cursor: "pointer",
    userSelect: "none",
    background: "transparent",

    ":hover": {
      background: tinycolor(theme.palette.neutralLight).setAlpha(0.5).toRgbString(),
    },
  },
  itemRemove: {
    visibility: "hidden",
    padding: "2px",
    cursor: "pointer",
    background: "transparent",

    ":hover": {
      background: tinycolor(theme.palette.neutralLight).setAlpha(0.75).toRgbString(),
    },
  },
  itemInput: {
    overflow: "hidden",
    width: "100%",
    display: "flex",
  },
  itemInputDisabled: {
    input: {
      textDecoration: "line-through",
    },
  },
}));

type PlotLegendProps = {
  paths: PlotPath[];
  saveConfig: (arg0: Partial<PlotConfig>) => void;
  showLegend: boolean;
  xAxisVal: PlotXAxisVal;
  xAxisPath?: BasePlotPath;
  pathsWithMismatchedDataLengths: string[];
  setLayout: (layout: MosaicNode<string>) => void;
};

const shortXAxisLabel = (path: PlotXAxisVal): string => {
  switch (path) {
    case "custom":
      return "path (accum)";
    case "index":
      return "index";
    case "currentCustom":
      return "path (current)";
    case "timestamp":
      return "timestamp";
  }
  throw new Error(`unknown path: ${path}`);
};

export default function PlotLegend(props: PlotLegendProps): JSX.Element | ReactNull {
  const { paths, saveConfig, setLayout, xAxisVal, xAxisPath, pathsWithMismatchedDataLengths } =
    props;
  const lastPath = last(paths);
  const classes = useStyles();

  const onInputChange = useCallback(
    (value: string, index?: number) => {
      if (index == undefined) {
        throw new Error("index not set");
      }
      const newPaths = paths.slice();
      const newPath = newPaths[index];
      if (newPath) {
        newPaths[index] = { ...newPath, value: value.trim() };
      }
      saveConfig({ paths: newPaths });
    },
    [paths, saveConfig],
  );

  const onInputTimestampMethodChange = useCallback(
    (value: TimestampMethod, index?: number) => {
      if (index == undefined) {
        throw new Error("index not set");
      }
      const newPaths = paths.slice();
      const newPath = newPaths[index];
      if (newPath) {
        newPaths[index] = { ...newPath, timestampMethod: value };
      }
      saveConfig({ paths: newPaths });
    },
    [paths, saveConfig],
  );

  const hideLegend = useCallback(() => {
    setLayout("plot");
    saveConfig({ showLegend: false });
  }, [setLayout, saveConfig]);

  return (
    <Flex className={classes.root} style={{ flex: 1 }}>
      <Icon
        className={classes.legendToggle}
        style={{ display: "block", height: "100%" }}
        onClick={hideLegend}
      >
        <MenuIcon />
      </Icon>
      <Stack grow tokens={{ childrenGap: 4 }}>
        <div className={classes.item}>
          x:
          <div
            className={classes.itemIconContainer}
            style={{ width: "auto", lineHeight: "normal", zIndex: 2 }}
          >
            <Dropdown
              value={xAxisVal}
              text={shortXAxisLabel(xAxisVal)}
              btnClassname={classes.dropdown}
              onChange={(newXAxisVal) => saveConfig({ xAxisVal: newXAxisVal })}
              noPortal
            >
              <DropdownItem value="timestamp">
                <span>timestamp</span>
              </DropdownItem>
              <DropdownItem value="index">
                <span>index</span>
              </DropdownItem>
              <DropdownItem value="currentCustom">
                <span>msg path (current)</span>
              </DropdownItem>
              <DropdownItem value="custom">
                <span>msg path (accumulated)</span>
              </DropdownItem>
            </Dropdown>
          </div>
          <div
            className={cx(classes.itemInput, {
              [classes.itemInputDisabled]: xAxisPath?.enabled !== true,
            })}
          >
            {(xAxisVal === "custom" || xAxisVal === "currentCustom") && (
              <MessagePathInput
                path={xAxisPath?.value ? xAxisPath.value : "/"}
                onChange={(newXAxisPath) =>
                  saveConfig({
                    xAxisPath: {
                      value: newXAxisPath,
                      enabled: xAxisPath ? xAxisPath.enabled : true,
                    },
                  })
                }
                validTypes={plotableRosTypes}
                placeholder="Enter a topic name or a number"
                disableAutocomplete={xAxisPath && isReferenceLinePlotPathType(xAxisPath)}
                autoSize
              />
            )}
          </div>
        </div>
        {paths.map((path: PlotPath, index: number) => {
          const isReferenceLinePlotPath = isReferenceLinePlotPathType(path);
          let timestampMethod;
          // Only allow chosing the timestamp method if it is applicable (not a reference line) and there is at least
          // one character typed.
          if (!isReferenceLinePlotPath && path.value.length > 0) {
            timestampMethod = path.timestampMethod;
          }
          const hasMismatchedDataLength = pathsWithMismatchedDataLengths.includes(path.value);

          return (
            <div key={index} className={classes.item}>
              <div
                className={classes.itemIconContainer}
                style={{ zIndex: 1 }}
                onClick={() => {
                  const newPaths = paths.slice();
                  const newPath = newPaths[index];
                  if (newPath) {
                    newPaths[index] = { ...newPath, enabled: !newPath.enabled };
                  }
                  saveConfig({ paths: newPaths });
                }}
              >
                <div
                  className={classes.itemIcon}
                  style={{ color: path.enabled ? lineColors[index % lineColors.length] : "#777" }}
                />
              </div>
              <div
                className={cx(classes.itemInput, {
                  [classes.itemInputDisabled]: !path.enabled,
                })}
              >
                <MessagePathInput
                  supportsMathModifiers
                  path={path.value}
                  onChange={onInputChange}
                  onTimestampMethodChange={onInputTimestampMethodChange}
                  validTypes={plotableRosTypes}
                  placeholder="Enter a topic name or a number"
                  index={index}
                  autoSize
                  disableAutocomplete={isReferenceLinePlotPath}
                  {...(xAxisVal === "timestamp" ? { timestampMethod } : undefined)}
                />
                {hasMismatchedDataLength && (
                  <Icon
                    style={{ color: colors.RED }}
                    clickable={false}
                    size="small"
                    tooltipProps={{ placement: "top" }}
                    tooltip="Mismatch in the number of elements in x-axis and y-axis messages"
                  >
                    <AlertCircleIcon />
                  </Icon>
                )}
              </div>
              <Icon
                data-item-remove
                className={classes.itemRemove}
                onClick={() => {
                  const newPaths = paths.slice();
                  newPaths.splice(index, 1);
                  saveConfig({ paths: newPaths });
                }}
              >
                <CloseIcon />
              </Icon>
            </div>
          );
        })}
        <div
          className={classes.fullLengthButton}
          onClick={() =>
            saveConfig({
              paths: [
                ...paths,
                {
                  value: "",
                  enabled: true,
                  // For convenience, default to the `timestampMethod` of the last path.
                  timestampMethod: lastPath ? lastPath.timestampMethod : "receiveTime",
                },
              ],
            })
          }
        >
          + add line
        </div>
      </Stack>
    </Flex>
  );
}
