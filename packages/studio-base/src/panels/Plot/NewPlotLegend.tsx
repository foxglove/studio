// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import AddIcon from "@mui/icons-material/Add";
import ArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import ArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import ArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import ArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import ListIcon from "@mui/icons-material/List";
import { Button, Divider, SvgIconProps, ToggleButton } from "@mui/material";
import { clamp } from "lodash";
import { ComponentProps, useCallback, useMemo, useRef } from "react";
import tinycolor from "tinycolor2";
import { makeStyles } from "tss-react/mui";

import { PANEL_TOOLBAR_MIN_HEIGHT } from "@foxglove/studio-base/components/PanelToolbar";
import Stack from "@foxglove/studio-base/components/Stack";
import TimeBasedChart from "@foxglove/studio-base/components/TimeBasedChart";
import { NewPlotLegendRow } from "@foxglove/studio-base/panels/Plot/NewPlotLegendRow";
import { PlotPath } from "@foxglove/studio-base/panels/Plot/internalTypes";
import { PlotConfig } from "@foxglove/studio-base/panels/Plot/types";
import { SaveConfig } from "@foxglove/studio-base/types/panels";

const minLegendWidth = 25;
const maxLegendWidth = 800;

type Props = {
  paths: PlotPath[];
  datasets: ComponentProps<typeof TimeBasedChart>["data"]["datasets"];
  currentTime?: number;
  saveConfig: SaveConfig<PlotConfig>;
  showLegend: boolean;
  pathsWithMismatchedDataLengths: string[];
  legendDisplay: "floating" | "top" | "left";
  showPlotValuesInLegend: boolean;
  sidebarDimension: number;
};

type StyleProps = {
  legendDisplay: Props["legendDisplay"];
  sidebarDimension: Props["sidebarDimension"];
};

const useStyles = makeStyles<StyleProps, "container" | "toggleButton">()(
  (theme, { legendDisplay, sidebarDimension }, classes) => ({
    root: {
      display: "flex",
      overflow: "hidden",
    },
    rootFloating: {
      gap: theme.spacing(0.5),
      height: `calc(100% - ${PANEL_TOOLBAR_MIN_HEIGHT}px)`,
      borderRadius: theme.shape.borderRadius,
      position: "absolute",
      top: theme.spacing(5.25),
      left: theme.spacing(4),
      zIndex: 1000,
      backgroundColor: "transparent",
      alignItems: "flex-start",

      [`.${classes.container}`]: {
        backgroundImage: `linear-gradient(${[
          "0deg",
          tinycolor(theme.palette.background.default).setAlpha(0.2).toHex8String(),
          tinycolor(theme.palette.background.default).setAlpha(0.2).toHex8String(),
        ].join(" ,")})`,
        backgroundColor: tinycolor(theme.palette.background.paper).setAlpha(0.8).toHex8String(),
      },

      [`.${classes.toggleButton}`]: {
        backgroundColor: tinycolor(theme.palette.background.paper).setAlpha(0.8).toHex8String(),
        backgroundImage: `linear-gradient(${[
          "0deg",
          tinycolor(theme.palette.background.default).setAlpha(0.2).toHex8String(),
          tinycolor(theme.palette.background.default).setAlpha(0.2).toHex8String(),
        ].join(" ,")})`,

        "&:hover":
          theme.palette.mode === "dark"
            ? {
                backgroundImage: `linear-gradient(0deg, ${[
                  tinycolor(theme.palette.background.default).setAlpha(0.2).toHex8String(),
                  tinycolor(theme.palette.background.default).setAlpha(0.2).toHex8String(),
                ].join(",")}),
                linear-gradient(0deg, ${[
                  theme.palette.action.hover,
                  theme.palette.action.hover,
                ].join(",")})`,
                backgroundColor: tinycolor(theme.palette.background.paper)
                  .setAlpha(0.8)
                  .toHex8String(),
              }
            : {
                backgroundColor: theme.palette.background.paper,
              },
      },
    },
    rootLeft: {
      alignItems: "flex-start",

      [`.${classes.toggleButton}`]: {
        height: "100%",
      },
    },
    rootTop: {
      flexDirection: "column",
    },
    container: {
      alignItems: "center",
      overflow: "auto",
      display: "grid",
      gridTemplateColumns: "auto minmax(max-content, 1fr) auto",
    },
    dragHandle: {
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
    },
    wrapperContent: {
      display: "flex",
      flexDirection: "column",
      flexGrow: 1,
      gap: theme.spacing(0.5),
      overflow: "auto",
      height: legendDisplay === "top" ? Math.round(sidebarDimension) : "auto",
      width: legendDisplay === "left" ? Math.round(sidebarDimension) : "auto",
    },
    footer: {
      gridColumn: "span 3",
      padding: theme.spacing(0.5),
    },
    addButton: {
      minWidth: 100,
      backgroundColor: `${theme.palette.action.hover} !important`,
    },
    toggleButton: {
      fontSize: theme.typography.pxToRem(20),
      padding: theme.spacing(0.5),
      border: "none",
    },
  }),
);

export function NewPlotLegend(props: Props): JSX.Element {
  const {
    paths,
    saveConfig,
    datasets,
    currentTime,
    legendDisplay,
    pathsWithMismatchedDataLengths,
    sidebarDimension,
    showLegend,
    showPlotValuesInLegend,
  } = props;
  const { classes, cx } = useStyles({ legendDisplay, sidebarDimension });

  const toggleLegend = useCallback(
    () => saveConfig({ showLegend: !showLegend }),
    [showLegend, saveConfig],
  );

  const toggleIcon = useMemo(() => {
    const iconProps = {
      fontSize: "inherit",
    } as Partial<SvgIconProps>;

    switch (legendDisplay) {
      case "floating":
        return <ListIcon {...iconProps} />;
      case "left":
        return showLegend ? <ArrowLeftIcon {...iconProps} /> : <ArrowRightIcon {...iconProps} />;
      case "top":
        return showLegend ? <ArrowUpIcon {...iconProps} /> : <ArrowDownIcon {...iconProps} />;
    }
  }, [legendDisplay, showLegend]);

  const togglePath = useCallback(
    (index: number) => {
      const newPaths = paths.slice();
      const newPath = newPaths[index];
      if (newPath) {
        newPaths[index] = { ...newPath, enabled: !newPath.enabled };
      }
      saveConfig({ paths: newPaths });
    },
    [paths, saveConfig],
  );

  const dragStart = useRef({ x: 0, y: 0, sidebarDimension: 0 });

  const handlePointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (legendDisplay === "floating" || event.buttons !== 1) {
        return;
      }
      const delta =
        legendDisplay === "left"
          ? event.clientX - dragStart.current.x
          : event.clientY - dragStart.current.y;
      const newDimension = clamp(
        dragStart.current.sidebarDimension + delta,
        minLegendWidth,
        maxLegendWidth,
      );
      saveConfig({ sidebarDimension: newDimension });
    },
    [legendDisplay, saveConfig],
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      dragStart.current = { x: event.clientX, y: event.clientY, sidebarDimension };
    },
    [sidebarDimension],
  );

  const handlePointerUp = useCallback((event: React.PointerEvent) => {
    event.currentTarget.releasePointerCapture(event.pointerId);
  }, []);

  const savePaths = useCallback(
    (newPaths: PlotPath[]) => {
      saveConfig({ paths: newPaths });
    },
    [saveConfig],
  );

  return (
    <div
      className={cx(classes.root, {
        [classes.rootFloating]: legendDisplay === "floating",
        [classes.rootLeft]: legendDisplay === "left",
        [classes.rootTop]: legendDisplay === "top",
      })}
    >
      <ToggleButton
        className={classes.toggleButton}
        aria-label={showLegend ? "Show legend" : "Hide legend"}
        value={showLegend ? "show" : "hide"}
        onClick={toggleLegend}
        size="small"
      >
        {toggleIcon}
      </ToggleButton>
      {showLegend && (
        <div className={classes.wrapperContent}>
          <Stack
            flex="auto"
            fullWidth
            style={{
              height:
                legendDisplay === "floating"
                  ? `calc(100% - ${PANEL_TOOLBAR_MIN_HEIGHT}px)`
                  : "100%",
            }}
          >
            <div className={classes.container}>
              {paths.map((path, index) => (
                <NewPlotLegendRow
                  key={index}
                  index={index}
                  path={path}
                  paths={paths}
                  hasMismatchedDataLength={pathsWithMismatchedDataLengths.includes(path.value)}
                  datasets={datasets}
                  currentTime={currentTime}
                  savePaths={savePaths}
                  showPlotValuesInLegend={showPlotValuesInLegend}
                />
              ))}
              <footer className={classes.footer}>
                <Button
                  className={classes.addButton}
                  size="small"
                  startIcon={<AddIcon />}
                  fullWidth
                  onClick={() => {}}
                >
                  Add line
                </Button>
              </footer>
            </div>
          </Stack>
          {legendDisplay !== "floating" && (
            <Divider flexItem orientation={legendDisplay === "left" ? "vertical" : "horizontal"} />
          )}
        </div>
      )}
      {legendDisplay !== "floating" && (
        <div
          className={classes.dragHandle}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
      )}
    </div>
  );
}
