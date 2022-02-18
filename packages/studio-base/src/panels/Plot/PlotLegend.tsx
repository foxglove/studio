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

import {
  Add as AddIcon,
  Menu as MenuIcon,
  KeyboardArrowLeft as KeyboardArrowLeftIcon,
  KeyboardArrowRight as KeyboardArrowRightIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
} from "@mui/icons-material";
import { Button, IconButton, Theme, alpha } from "@mui/material";
import { makeStyles } from "@mui/styles";
import cx from "classnames";
import { last } from "lodash";
import { ComponentProps, useCallback, useMemo, useRef } from "react";

import Dropdown from "@foxglove/studio-base/components/Dropdown";
import DropdownItem from "@foxglove/studio-base/components/Dropdown/DropdownItem";
import MessagePathInput from "@foxglove/studio-base/components/MessagePathSyntax/MessagePathInput";
import TimeBasedChart from "@foxglove/studio-base/components/TimeBasedChart";
import PlotLegendRow from "@foxglove/studio-base/panels/Plot/PlotLegendRow";

import { PlotPath, BasePlotPath, isReferenceLinePlotPathType } from "./internalTypes";
import { plotableRosTypes, PlotConfig, PlotXAxisVal } from "./types";

const minLegendWidth = 25;
const maxLegendWidth = 800;

type PlotLegendProps = {
  paths: PlotPath[];
  datasets: ComponentProps<typeof TimeBasedChart>["data"]["datasets"];
  currentTime?: number;
  saveConfig: (arg0: Partial<PlotConfig>) => void;
  showLegend: boolean;
  xAxisVal: PlotXAxisVal;
  xAxisPath?: BasePlotPath;
  pathsWithMismatchedDataLengths: string[];
  sidebarDimension: number;
  legendDisplay: "floating" | "top" | "left";
  showPlotValuesInLegend: boolean;
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

type StyleProps = {
  legendDisplay: PlotLegendProps["legendDisplay"];
  showPlotValuesInLegend?: PlotLegendProps["showPlotValuesInLegend"];
  sidebarDimension: PlotLegendProps["sidebarDimension"];
};

const useStyles = makeStyles((theme: Theme) => ({
  floatingWrapper: {
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
  wrapper: ({ legendDisplay }: StyleProps) => ({
    display: "flex",
    flexDirection: legendDisplay === "left" ? "row" : "column",
    width: legendDisplay === "top" ? "100%" : undefined,
    height: legendDisplay === "left" ? "100%" : undefined,
  }),
  wrapperContent: ({ legendDisplay, sidebarDimension }: StyleProps) => ({
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    gap: theme.spacing(0.5),
    overflow: "auto",
    [legendDisplay === "left" ? "width" : "height"]: sidebarDimension,
  }),
  dragHandle: ({ legendDisplay }: StyleProps) => ({
    userSelect: "none",
    border: `0px solid ${theme.palette.action.hover}`,
    ...(legendDisplay === "left"
      ? {
          cursor: "ew-resize",
          borderRightWidth: 2,
          height: "100%",
          width: theme.spacing(0.5),
        }
      : {
          cursor: "ns-resize",
          borderBottomWidth: 2,
          height: theme.spacing(0.5),
          width: "100%",
        }),

    "&:hover": {
      borderColor: theme.palette.action.selected,
    },
  }),
  legendContent: ({ legendDisplay }) => ({
    display: "flex",
    flexDirection: "column",
    backgroundColor: alpha(theme.palette.background.paper, 0.8),
    overflow: "auto",
    pointerEvents: "auto",
    [legendDisplay !== "floating" ? "height" : "maxHeight"]: "100%",
    position: "relative",
  }),
  header: {
    display: "flex",
    alignItems: "center",
    padding: theme.spacing(0.25),
    height: 26,
    position: "sticky",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.palette.background.paper,
    zIndex: theme.zIndex.mobileStepper + 1,
  },
  dropdownWrapper: {
    zIndex: 4,
    height: 20,

    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
  },
  dropdown: {
    backgroundColor: "transparent !important",
    padding: "4px !important",
  },
  grid: {
    alignItems: "stretch",
    position: "relative",
    display: "grid",
    gridTemplateColumns: ({ showPlotValuesInLegend = false }: StyleProps) =>
      [
        "auto",
        "minmax(max-content, 1fr)",
        showPlotValuesInLegend && "minmax(max-content, 1fr)",
        "auto",
      ]
        .filter(Boolean)
        .join(" "),
  },
  footer: ({ legendDisplay }) => ({
    padding: theme.spacing(0.5),
    gridColumn: "span 4",
    ...(legendDisplay !== "floating" && {
      position: "sticky",
      right: 0,
      left: 0,
    }),
  }),
  addButton: {
    minWidth: 100,
    backgroundColor: `${theme.palette.action.hover} !important`,
  },
  root: {
    display: "flex",
    alignItems: "flex-start",
    flexDirection: ({ legendDisplay }) => (legendDisplay === "top" ? "column" : undefined),
    position: "relative",
    color: theme.palette.text.secondary,
    backgroundColor: theme.palette.background.paper,
    borderTop: `${theme.palette.background.default} solid 1px`,
  },
  floatingRoot: {
    cursor: "pointer",
    position: "absolute",
    left: theme.spacing(4),
    top: theme.spacing(1),
    bottom: theme.spacing(3),
    maxWidth: `calc(100% - ${theme.spacing(8)})`,
    backgroundColor: "transparent",
    borderTop: "none",
    pointerEvents: "none",
    zIndex: theme.zIndex.mobileStepper,
    gap: theme.spacing(0.5),
  },
  legendToggle: ({ legendDisplay }: StyleProps) => ({
    cursor: "pointer",
    userSelect: "none",
    pointerEvents: "auto",
    ...{
      left: { height: "100%", padding: "0px !important" },
      top: { width: "100%", padding: "0px !important" },
      floating: undefined,
    }[legendDisplay],

    "&:hover": {
      backgroundColor: theme.palette.action.focus,
    },
  }),
  floatingLegendToggle: {
    marginRight: theme.spacing(0.25),
    visibility: "hidden",
    borderRadius: theme.shape.borderRadius,
    backgroundColor: `${theme.palette.action.focus} !important`,
    // height: "inherit",

    "&:hover": {
      backgroundColor: theme.palette.background.paper,
    },
    ".mosaic-window:hover &": { visibility: "initial" },
  },
}));

function SidebarWrapper(props: {
  legendDisplay: "floating" | "top" | "left";
  sidebarDimension: number;
  saveConfig: (arg0: Partial<PlotConfig>) => void;
  children: JSX.Element | undefined;
}): JSX.Element | ReactNull {
  const { legendDisplay, sidebarDimension, saveConfig } = props;
  const classes = useStyles({ legendDisplay, sidebarDimension });
  const originalWrapper = useRef<DOMRect | undefined>(undefined);
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const offset = originalWrapper.current?.[legendDisplay as "top" | "left"] ?? 0;
      const newDimension = e[legendDisplay === "left" ? "clientX" : "clientY"] - offset;
      if (newDimension > minLegendWidth && newDimension < maxLegendWidth) {
        saveConfig({ sidebarDimension: newDimension });
      }
    },
    [originalWrapper, legendDisplay, saveConfig],
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
    <div className={classes.wrapper}>
      <div className={classes.wrapperContent}>{props.children}</div>
      <div className={classes.dragHandle} onMouseDown={handleMouseDown} />
    </div>
  );
}

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
    sidebarDimension,
    legendDisplay,
    showPlotValuesInLegend,
  } = props;
  const lastPath = last(paths);
  const classes = useStyles({ legendDisplay, sidebarDimension, showPlotValuesInLegend });

  const toggleLegend = useCallback(
    () => saveConfig({ showLegend: !showLegend }),
    [showLegend, saveConfig],
  );

  const legendIcon = useMemo(() => {
    if (legendDisplay !== "floating") {
      const iconMap = showLegend
        ? { left: KeyboardArrowLeftIcon, top: KeyboardArrowUpIcon }
        : { left: KeyboardArrowRightIcon, top: KeyboardArrowDownIcon };
      const ArrowIcon = iconMap[legendDisplay];
      return <ArrowIcon fontSize="inherit" />;
    }
    return <MenuIcon fontSize="inherit" />;
  }, [showLegend, legendDisplay]);

  const legendContent = useMemo(
    () => (
      <div className={classes.legendContent}>
        <header className={classes.header}>
          <div className={classes.dropdownWrapper}>
            <Dropdown
              value={xAxisVal}
              text={`x: ${shortXAxisLabel(xAxisVal)}`}
              btnClassname={classes.dropdown}
              onChange={(newXAxisVal) => saveConfig({ xAxisVal: newXAxisVal })}
              noPortal
            >
              <DropdownItem value="timestamp">timestamp</DropdownItem>
              <DropdownItem value="index">index</DropdownItem>
              <DropdownItem value="currentCustom">msg path (current)</DropdownItem>
              <DropdownItem value="custom">msg path (accumulated)</DropdownItem>
            </Dropdown>
          </div>
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
        </header>
        <div className={classes.grid}>
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
                showPlotValuesInLegend={showPlotValuesInLegend}
              />
            );
          })}
        </div>
        <footer className={classes.footer}>
          <Button
            className={classes.addButton}
            size="small"
            fullWidth
            startIcon={<AddIcon />}
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
            Add line
          </Button>
        </footer>
      </div>
    ),
    [
      classes.legendContent,
      classes.header,
      classes.dropdownWrapper,
      classes.dropdown,
      classes.grid,
      classes.footer,
      classes.addButton,
      xAxisVal,
      xAxisPath,
      paths,
      saveConfig,
      pathsWithMismatchedDataLengths,
      datasets,
      currentTime,
      showPlotValuesInLegend,
      lastPath,
    ],
  );

  return (
    <div className={cx(classes.root, { [classes.floatingRoot]: legendDisplay === "floating" })}>
      <IconButton
        size="small"
        onClick={toggleLegend}
        className={cx(classes.legendToggle, {
          [classes.floatingLegendToggle]: legendDisplay === "floating",
        })}
      >
        {legendIcon}
      </IconButton>
      {showLegend &&
        (legendDisplay === "floating" ? (
          <div className={classes.floatingWrapper}>{legendContent}</div>
        ) : (
          <SidebarWrapper
            legendDisplay={legendDisplay}
            sidebarDimension={sidebarDimension}
            saveConfig={saveConfig}
          >
            {legendContent}
          </SidebarWrapper>
        ))}
    </div>
  );
}
