// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import CheckIcon from "@mui/icons-material/Check";
import CircleIcon from "@mui/icons-material/Circle";
import CircleOutlinedIcon from "@mui/icons-material/CircleOutlined";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import ErrorIcon from "@mui/icons-material/Error";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { IconButton, InputBase, SvgIcon, Tooltip, Typography, useTheme } from "@mui/material";
import produce from "immer";
import { ChangeEvent, ComponentProps, useCallback, useMemo, useState } from "react";
import { makeStyles } from "tss-react/mui";
import { useImmer } from "use-immer";
import { v4 as uuidv4 } from "uuid";

import { usePanelContext } from "@foxglove/studio-base/components/PanelContext";
import TimeBasedChart from "@foxglove/studio-base/components/TimeBasedChart";
import { useSelectedPanels } from "@foxglove/studio-base/context/CurrentLayoutContext";
import { useHoverValue } from "@foxglove/studio-base/context/TimelineInteractionStateContext";
import { useWorkspace } from "@foxglove/studio-base/context/WorkspaceContext";
import { getLineColor } from "@foxglove/studio-base/util/plotColors";

import { PlotPath } from "./internalTypes";

type PlotLegendRowProps = {
  index: number;
  path: PlotPath;
  paths: PlotPath[];
  hasMismatchedDataLength: boolean;
  datasets: ComponentProps<typeof TimeBasedChart>["data"]["datasets"];
  currentTime?: number;
  savePaths: (paths: PlotPath[]) => void;
  showPlotValuesInLegend: boolean;
};

const useStyles = makeStyles()((theme) => ({
  root: {
    display: "contents",

    "&:hover, &:focus-within": {
      "& > *:last-child": {
        opacity: 1,
      },
      "& > *": {
        backgroundColor: theme.palette.action.hover,
      },
    },
  },
  editNameField: {
    font: "inherit",
    gridColumn: "span 2",
    width: "100%",
    fontSize: theme.typography.pxToRem(16),

    input: {
      height: "100%",
    },
  },
  listIcon: {
    display: "flex",
    alignItems: "center",
    position: "sticky",
    left: 0,
    padding: theme.spacing(0, 0.25),
    height: 28,
  },
  legendIconButton: {
    padding: `${theme.spacing(0.75)} !important`,
    marginLeft: theme.spacing(0.125),
    fontSize: theme.typography.pxToRem(14),
  },
  inputWrapper: {
    display: "flex",
    alignItems: "center",
    height: 28,
    padding: theme.spacing(0, 0.25),
    minWidth: 140,
  },
  plotValue: {
    display: "flex",
    alignItems: "center",
    padding: theme.spacing(0.25),
  },
  actionButton: {
    padding: `${theme.spacing(0.25)} !important`,
    color: theme.palette.text.secondary,

    "&:hover": {
      color: theme.palette.text.primary,
    },
  },
  actions: {
    height: 28,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing(0.25),
    padding: theme.spacing(0.25),
    position: "sticky",
    right: 0,
    opacity: 0,

    "&:hover": {
      opacity: 1,
    },
  },
}));

export function NewPlotLegendRow({
  index,
  path,
  paths,
  hasMismatchedDataLength,
  datasets,
  currentTime,
  savePaths,
  showPlotValuesInLegend,
}: PlotLegendRowProps): JSX.Element {
  const { openPanelSettings } = useWorkspace();
  const { id: panelId } = usePanelContext();
  const { setSelectedPanelIds } = useSelectedPanels();
  const theme = useTheme();
  const { classes } = useStyles();

  const correspondingData = useMemo(() => {
    if (!showPlotValuesInLegend) {
      return [];
    }
    return datasets.find((set) => set.label === path.value)?.data ?? [];
  }, [datasets, path.value, showPlotValuesInLegend]);

  const [hoverComponentId] = useState<string>(() => uuidv4());
  const hoverValue = useHoverValue({
    componentId: hoverComponentId,
    isTimestampScale: true,
  });

  const [state, setState] = useImmer<{ editing: boolean }>({ editing: false });

  const currentDisplay = useMemo(() => {
    if (!showPlotValuesInLegend) {
      return {
        value: undefined,
        color: "inherit",
      };
    }
    const timeToCompare = hoverValue?.value ?? currentTime;

    let value;
    for (const pt of correspondingData) {
      if (timeToCompare == undefined || pt == undefined || pt.x > timeToCompare) {
        break;
      }
      value = pt.y;
    }
    return {
      value,
      color: hoverValue?.value != undefined ? theme.palette.warning.main : "inherit",
    };
  }, [showPlotValuesInLegend, hoverValue?.value, currentTime, theme.palette, correspondingData]);

  const toggleEditing = useCallback(
    () =>
      setState((draft) => {
        draft.editing = !draft.editing;
      }),
    [setState],
  );

  const onEditLabel = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      savePaths(
        produce(paths, (draft) => {
          draft[index]!.label = event.target.value;
        }),
      );
    },
    [index, paths, savePaths],
  );

  const onLabelKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter" || event.key === "Escape") {
        toggleEditing();
      }
    },
    [toggleEditing],
  );

  return (
    <div className={classes.root}>
      <div className={classes.listIcon}>
        <IconButton
          className={classes.legendIconButton}
          centerRipple={false}
          size="small"
          title="Toggle visibility"
          onClick={() => {
            const newPaths = paths.slice();
            const newPath = newPaths[index];
            if (newPath) {
              newPaths[index] = { ...newPath, enabled: !newPath.enabled };
            }
            savePaths(newPaths);
          }}
          style={{ color: getLineColor(path.color, index) }}
        >
          {path.enabled ? (
            <CircleIcon fontSize="inherit" />
          ) : (
            <CircleOutlinedIcon fontSize="inherit" />
          )}
        </IconButton>
      </div>
      <div className={classes.inputWrapper}>
        {state.editing ? (
          <InputBase
            className={classes.editNameField}
            autoFocus
            onChange={onEditLabel}
            value={path.label}
            onBlur={toggleEditing}
            onKeyDown={onLabelKeyDown}
            onFocus={(event) => event.target.select()}
          />
        ) : (
          <Typography noWrap={true} flex="auto" variant="subtitle2">
            {path.label ?? path.value}
          </Typography>
        )}
        {hasMismatchedDataLength && (
          <Tooltip
            placement="top"
            title="Mismatch in the number of elements in x-axis and y-axis messages"
          >
            <ErrorIcon fontSize="small" color="error" />
          </Tooltip>
        )}
      </div>
      {showPlotValuesInLegend && (
        <div className={classes.plotValue} style={{ color: currentDisplay.color }}>
          <Typography component="div" variant="body2" align="right" color="inherit">
            {currentDisplay.value ?? ""}
          </Typography>
        </div>
      )}
      <div className={classes.actions}>
        {state.editing ? (
          <IconButton
            className={classes.actionButton}
            title="Rename"
            data-node-function="edit-label"
            color="primary"
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              toggleEditing();
            }}
          >
            <CheckIcon fontSize="small" />
          </IconButton>
        ) : (
          <IconButton
            className={classes.actionButton}
            title="Rename"
            size="small"
            data-node-function="edit-label"
            color="primary"
            onClick={(event) => {
              event.stopPropagation();
              toggleEditing();
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        )}
        <IconButton
          className={classes.actionButton}
          size="small"
          title="Edit settings"
          onClick={() => {
            setSelectedPanelIds([panelId]);
            openPanelSettings();
          }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
        <IconButton
          className={classes.actionButton}
          size="small"
          title={`Remove ${path.value}`}
          onClick={() => {
            const newPaths = paths.slice();
            newPaths.splice(index, 1);
            savePaths(newPaths);
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>
    </div>
  );
}
