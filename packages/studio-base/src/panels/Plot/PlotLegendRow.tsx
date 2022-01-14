// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useTheme as useFluentUITheme } from "@fluentui/react";
import { Close as CloseIcon, Error as ErrorIcon, Remove as RemoveIcon } from "@mui/icons-material";
import {
  Box,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Stack,
  Tooltip,
} from "@mui/material";
import { ComponentProps, useCallback, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import MessagePathInput from "@foxglove/studio-base/components/MessagePathSyntax/MessagePathInput";
import TimeBasedChart from "@foxglove/studio-base/components/TimeBasedChart";
import { useHoverValue } from "@foxglove/studio-base/context/HoverValueContext";
import { lineColors } from "@foxglove/studio-base/util/plotColors";
import { TimestampMethod } from "@foxglove/studio-base/util/time";

import { PlotPath, isReferenceLinePlotPathType } from "./internalTypes";
import { plotableRosTypes, PlotConfig, PlotXAxisVal } from "./types";

type PlotLegendRowProps = {
  index: number;
  xAxisVal: PlotXAxisVal;
  path: PlotPath;
  paths: PlotPath[];
  hasMismatchedDataLength: boolean;
  datasets: ComponentProps<typeof TimeBasedChart>["data"]["datasets"];
  currentTime?: number;
  saveConfig: (arg0: Partial<PlotConfig>) => void;
};

export default function PlotLegendRow({
  index,
  xAxisVal,
  path,
  paths,
  hasMismatchedDataLength,
  datasets,
  currentTime,
  saveConfig,
}: PlotLegendRowProps): JSX.Element {
  const correspondingData = useMemo(
    () => datasets.find((set) => set.label === path?.value)?.data ?? [],
    [datasets, path?.value],
  );

  const [hoverComponentId] = useState<string>(() => uuidv4());
  const hoverValue = useHoverValue({
    componentId: hoverComponentId,
    isTimestampScale: true,
  });

  const fluentUITheme = useFluentUITheme();
  const currentDisplay = useMemo(() => {
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
      color: hoverValue?.value != undefined ? fluentUITheme.palette.yellowDark : "inherit",
    };
  }, [hoverValue, correspondingData, currentTime, fluentUITheme]);

  const isReferenceLinePlotPath = isReferenceLinePlotPathType(path);
  let timestampMethod;
  // Only allow chosing the timestamp method if it is applicable (not a reference line) and there is at least
  // one character typed.
  if (!isReferenceLinePlotPath && path.value.length > 0) {
    timestampMethod = path.timestampMethod;
  }

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
      saveConfig({ paths: newPaths });
    },
    [paths, saveConfig],
  );

  const onInputTimestampMethodChange = useCallback(
    (value: TimestampMethod) => {
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
    [paths, index, saveConfig],
  );

  return (
    <ListItem
      disableGutters
      disablePadding
      sx={{
        height: 26,
        alignItems: "center",

        "&:hover, &:focus-within": {
          bgcolor: "action.hover",

          "+ .MuiListItemSecondaryAction-root": {
            visibility: "visible",
          },
          "& .MuiListItemIcon-root .MuiIconButton-root": {
            bgcolor: "action.hover",
          },
        },
      }}
    >
      <ListItemIcon sx={{ minWidth: "auto" }}>
        <IconButton
          centerRipple={false}
          size="small"
          sx={{ zIndex: 1, padding: 0.125, marginLeft: 0.25 }}
          title="Toggle visibility"
          onClick={() => {
            const newPaths = paths.slice();
            const newPath = newPaths[index];
            if (newPath) {
              newPaths[index] = { ...newPath, enabled: !newPath.enabled };
            }
            saveConfig({ paths: newPaths });
          }}
        >
          <RemoveIcon
            sx={{ color: path.enabled ? lineColors[index % lineColors.length] : "#777" }}
          />
        </IconButton>
      </ListItemIcon>
      <ListItemText
        disableTypography
        sx={{
          minWidth: 0,
          flexGrow: 0,
        }}
      >
        <Box sx={{ input: { textDecoration: !path.enabled ? "line-through" : "none" } }}>
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
            <Tooltip
              placement="top"
              title="Mismatch in the number of elements in x-axis and y-axis messages"
            >
              <ErrorIcon fontSize="small" sx={{ color: "error.main" }} />
            </Tooltip>
          )}
        </Box>
      </ListItemText>
      {currentDisplay.value != undefined && (
        <ListItemText
          sx={{
            color: currentDisplay.color,
            minWidth: 128,
          }}
          primaryTypographyProps={{ variant: "body2", align: "right" }}
        >
          {currentDisplay.value}
        </ListItemText>
      )}
      <ListItemSecondaryAction
        sx={{
          visibility: "hidden",
          padding: 0.5,

          "&:hover": { visibility: "visible" },
        }}
      >
        <Stack direction="row">
          <IconButton
            size="small"
            title={`Remove ${path.value}`}
            sx={{ padding: 0.25, color: "text.secondary", "&:hover": { color: "text.primary" } }}
            onClick={() => {
              const newPaths = paths.slice();
              newPaths.splice(index, 1);
              saveConfig({ paths: newPaths });
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </ListItemSecondaryAction>
    </ListItem>
  );
}
