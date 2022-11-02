// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import CircleIcon from "@mui/icons-material/Circle";
import { IconButton, Typography } from "@mui/material";
import { ComponentProps, Fragment, useCallback } from "react";
import { makeStyles } from "tss-react/mui";

import TimeBasedChart from "@foxglove/studio-base/components/TimeBasedChart";
import { NewPlotLegendRow } from "@foxglove/studio-base/panels/Plot/NewPlotLegendRow";
import { PlotPath, BasePlotPath } from "@foxglove/studio-base/panels/Plot/internalTypes";
import { PlotConfig, PlotXAxisVal } from "@foxglove/studio-base/panels/Plot/types";
import { SaveConfig } from "@foxglove/studio-base/types/panels";

type Props = {
  paths: PlotPath[];
  datasets: ComponentProps<typeof TimeBasedChart>["data"]["datasets"];
  currentTime?: number;
  saveConfig: SaveConfig<PlotConfig>;
  showLegend: boolean;
  xAxisVal: PlotXAxisVal;
  xAxisPath?: BasePlotPath;
  pathsWithMismatchedDataLengths: string[];
  sidebarDimension: number;
  legendDisplay: "floating" | "top" | "left";
  showPlotValuesInLegend: boolean;
};

const useStyles = makeStyles()((theme) => ({
  root: {
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(2),
  },

  rootFloating: {
    position: "absolute",
    top: theme.spacing(4),
    left: theme.spacing(4),
    zIndex: 1000,
  },

  container: {
    alignItems: "center",
    display: "grid",
    gap: theme.spacing(1),
    gridTemplateColumns: "auto minmax(max-content, 1fr) minmax(max-content, 1fr) auto",
  },

  toggleButton: {
    fontSize: 8,
  },
}));

export function NewPlotLegend(props: Props): JSX.Element {
  const {
    paths,
    saveConfig,
    xAxisVal,
    datasets,
    currentTime,
    pathsWithMismatchedDataLengths,
    showPlotValuesInLegend,
  } = props;
  const { classes, cx } = useStyles();

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

  const savePaths = useCallback(
    (newPaths: PlotPath[]) => {
      saveConfig({ paths: newPaths });
    },
    [saveConfig],
  );

  return (
    <div
      className={cx(classes.root, { [classes.rootFloating]: props.legendDisplay === "floating" })}
    >
      <div className={classes.container}>
        {paths.map((path, index) => (
          <NewPlotLegendRow
            key={index}
            index={index}
            xAxisVal={xAxisVal}
            path={path}
            paths={paths}
            hasMismatchedDataLength={pathsWithMismatchedDataLengths.includes(path.value)}
            datasets={datasets}
            currentTime={currentTime}
            savePaths={savePaths}
            showPlotValuesInLegend={showPlotValuesInLegend}
          />
          //   <Fragment key={`${path}_${index}`}>
          //     <IconButton onClick={() => togglePath(index)}>
          //       <CircleIcon className={classes.toggleButton} style={{ color: path.color }} />
          //     </IconButton>
          //     {path.label ?? path.value}
          //   </Fragment>
        ))}
      </div>
    </div>
  );
}
