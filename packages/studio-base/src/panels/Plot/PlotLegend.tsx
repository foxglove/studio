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
import { Stack } from "@fluentui/react";
import MenuIcon from "@mdi/svg/svg/menu.svg";
import cx from "classnames";
import { last } from "lodash";
import { ComponentProps, useCallback, useRef } from "react";

import Dropdown from "@foxglove/studio-base/components/Dropdown";
import DropdownItem from "@foxglove/studio-base/components/Dropdown/DropdownItem";
import Flex from "@foxglove/studio-base/components/Flex";
import Icon from "@foxglove/studio-base/components/Icon";
import MessagePathInput from "@foxglove/studio-base/components/MessagePathSyntax/MessagePathInput";
import TimeBasedChart from "@foxglove/studio-base/components/TimeBasedChart";
import PlotLegendRow from "@foxglove/studio-base/panels/Plot/PlotLegendRow";
import usePlotStyles from "@foxglove/studio-base/panels/Plot/usePlotStyles";

import { PlotPath, BasePlotPath, isReferenceLinePlotPathType } from "./internalTypes";
import { plotableRosTypes, PlotConfig, PlotXAxisVal } from "./types";

const minLegendWidth = 25;
const maxLegendWidth = 500;

type PlotLegendProps = {
  paths: PlotPath[];
  datasets: ComponentProps<typeof TimeBasedChart>["data"]["datasets"];
  currentTime?: number;
  saveConfig: (arg0: Partial<PlotConfig>) => void;
  showLegend: boolean;
  xAxisVal: PlotXAxisVal;
  xAxisPath?: BasePlotPath;
  pathsWithMismatchedDataLengths: string[];
  legendWidth: number;
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
  const {
    paths,
    datasets,
    currentTime,
    saveConfig,
    showLegend,
    xAxisVal,
    xAxisPath,
    pathsWithMismatchedDataLengths,
    legendWidth,
  } = props;

  const lastPath = last(paths);
  const classes = usePlotStyles();

  const toggleLegend = useCallback(
    () => saveConfig({ showLegend: !showLegend }),
    [showLegend, saveConfig],
  );

  const originalWrapper = useRef<DOMRect | undefined>(undefined);
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const offsetLeft = originalWrapper.current?.left ?? 0;
      const newWidth = e.clientX - offsetLeft;
      if (newWidth > minLegendWidth && newWidth < maxLegendWidth) {
        saveConfig({ legendWidth: newWidth });
      }
    },
    [originalWrapper, saveConfig],
  );

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    originalWrapper.current = (e.target as Node).parentElement?.getBoundingClientRect() as DOMRect;
    document.addEventListener("mouseup", handleMouseUp, true);
    document.addEventListener("mousemove", handleMouseMove, true);
  };

  const handleMouseUp = () => {
    originalWrapper.current = undefined;
    document.removeEventListener("mouseup", handleMouseUp, true);
    document.removeEventListener("mousemove", handleMouseMove, true);
  };

  return (
    <Flex className={classes.root} style={{ flex: 1, position: "relative" }}>
      <Icon
        className={classes.legendToggle}
        style={{ display: "block", height: "100%" }}
        onClick={toggleLegend}
      >
        <MenuIcon />
      </Icon>
      {showLegend ? (
        <>
          <div onMouseDown={handleMouseDown} className={classes.dragger} />
          <Stack
            grow
            tokens={{ childrenGap: 4 }}
            style={{ width: legendWidth, overflow: "scroll" }}
          >
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
              const hasMismatchedDataLength = pathsWithMismatchedDataLengths.includes(path.value);
              return (
                <PlotLegendRow
                  key={index}
                  index={index}
                  xAxisVal={xAxisVal}
                  path={path}
                  paths={paths}
                  hasMismatchedDataLength={hasMismatchedDataLength}
                  datasets={datasets}
                  currentTime={currentTime}
                  saveConfig={saveConfig}
                />
              );
            })}
            <div
              className={classes.fullLengthButton}
              style={{ minWidth: "100px" }}
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
        </>
      ) : undefined}
    </Flex>
  );
}
