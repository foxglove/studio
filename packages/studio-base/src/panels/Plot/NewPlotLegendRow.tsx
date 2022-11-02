// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  Close as CloseIcon,
  Error as ErrorIcon,
  Remove as RemoveIcon,
  MoreVert as MoreVertIcon,
} from "@mui/icons-material";
import CheckIcon from "@mui/icons-material/Check";
import EditIcon from "@mui/icons-material/Edit";
import { IconButton, TextField, Tooltip, Typography, useTheme } from "@mui/material";
import produce from "immer";
import { ChangeEvent, ComponentProps, useCallback, useMemo, useState } from "react";
import { makeStyles } from "tss-react/mui";
import { useImmer } from "use-immer";
import { v4 as uuidv4 } from "uuid";

import MessagePathInput from "@foxglove/studio-base/components/MessagePathSyntax/MessagePathInput";
import TimeBasedChart from "@foxglove/studio-base/components/TimeBasedChart";
import { useHoverValue } from "@foxglove/studio-base/context/TimelineInteractionStateContext";
import { getLineColor } from "@foxglove/studio-base/util/plotColors";

import PathSettingsModal from "./PathSettingsModal";
import { PlotPath, isReferenceLinePlotPathType } from "./internalTypes";
import { plotableRosTypes, PlotXAxisVal } from "./types";

type PlotLegendRowProps = {
  index: number;
  xAxisVal: PlotXAxisVal;
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
      "& .MuiIconButton-root": {
        backgroundColor: theme.palette.action.hover,
      },
      "& > *:last-child": {
        opacity: 1,
      },
      "& > *": {
        backgroundColor: theme.palette.action.hover,
      },
    },
  },

  editButton: {
    padding: theme.spacing(0.5),
  },

  editNameField: {
    font: "inherit",
    gridColumn: "span 2",
    width: "100%",

    ".MuiInputBase-input": {
      fontSize: "0.75rem",
      padding: theme.spacing(0.75, 1),
    },
  },

  listIcon: {
    padding: theme.spacing(0.25),
    position: "sticky",
    left: 0,
    // creates an opaque background for the sticky element
    backgroundImage: `linear-gradient(${theme.palette.background.paper}, ${theme.palette.background.paper})`,
    backgroundBlendMode: "overlay",
  },
  legendIconButton: {
    padding: `${theme.spacing(0.125)} !important`,
    marginLeft: theme.spacing(0.25),
  },
  inputWrapper: {
    display: "flex",
    alignItems: "center",
    padding: theme.spacing(0.25),
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
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing(0.25),
    gap: theme.spacing(0.25),
    position: "sticky",
    right: 0,
    opacity: 0,
    // creates an opaque background for the sticky element
    backgroundImage: `linear-gradient(${theme.palette.background.paper}, ${theme.palette.background.paper})`,
    backgroundBlendMode: "overlay",

    "&:hover": {
      opacity: 1,
    },
  },
}));

export function NewPlotLegendRow({
  index,
  xAxisVal,
  path,
  paths,
  hasMismatchedDataLength,
  datasets,
  currentTime,
  savePaths,
  showPlotValuesInLegend,
}: PlotLegendRowProps): JSX.Element {
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

  const theme = useTheme();

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

  const legendIconColor = path.enabled
    ? getLineColor(path.color, index)
    : theme.palette.text.secondary;

  const { classes } = useStyles();

  const isReferenceLinePlotPath = isReferenceLinePlotPathType(path);

  const onInputChange = useCallback(
    (value: string, idx?: number) => {
      if (idx == undefined) {
        throw new Error("index not set");
      }
      const newPaths = paths.slice();
      const newPath = newPaths[idx];
      if (newPath) {
        newPaths[idx] = { ...newPath, value: value.trim() };
      }
      savePaths(newPaths);
    },
    [paths, savePaths],
  );

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

  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  const messagePathInputStyle = useMemo(() => {
    return { textDecoration: !path.enabled ? "line-through" : undefined };
  }, [path.enabled]);

  return (
    <div className={classes.root}>
      <div style={{ position: "absolute" }}>
        {settingsModalOpen && (
          <PathSettingsModal
            xAxisVal={xAxisVal}
            path={path}
            paths={paths}
            index={index}
            savePaths={savePaths}
            onDismiss={() => setSettingsModalOpen(false)}
          />
        )}
      </div>
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
        >
          <RemoveIcon style={{ color: legendIconColor }} color="inherit" />
        </IconButton>
      </div>
      <div className={classes.inputWrapper}>
        {state.editing ? (
          <TextField
            className={classes.editNameField}
            autoFocus
            variant="filled"
            onChange={onEditLabel}
            value={path.label}
            onBlur={toggleEditing}
            onKeyDown={onLabelKeyDown}
            onFocus={(event) => event.target.select()}
            InputProps={{
              endAdornment: (
                <IconButton
                  className={classes.editButton}
                  title="Rename"
                  data-node-function="edit-label"
                  color="primary"
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleEditing();
                  }}
                >
                  <CheckIcon fontSize="small" />
                </IconButton>
              ),
            }}
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
      {!state.editing && (
        <IconButton
          className={classes.editButton}
          title="Rename"
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
      <div className={classes.actions}>
        <IconButton
          className={classes.actionButton}
          size="small"
          title="Edit settings"
          onClick={() => setSettingsModalOpen(true)}
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
