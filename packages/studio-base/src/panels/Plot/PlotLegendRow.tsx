// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
import { useTheme } from "@fluentui/react";
import AlertCircleIcon from "@mdi/svg/svg/alert-circle.svg";
import CloseIcon from "@mdi/svg/svg/close.svg";
import cx from "classnames";
import { ComponentProps, useCallback, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import Flex from "@foxglove/studio-base/components/Flex";
import Icon from "@foxglove/studio-base/components/Icon";
import MessagePathInput from "@foxglove/studio-base/components/MessagePathSyntax/MessagePathInput";
import TimeBasedChart from "@foxglove/studio-base/components/TimeBasedChart";
import { useHoverValue } from "@foxglove/studio-base/context/HoverValueContext";
import usePlotStyles from "@foxglove/studio-base/panels/Plot/usePlotStyles";
import { lineColors } from "@foxglove/studio-base/util/plotColors";
import { colors } from "@foxglove/studio-base/util/sharedStyleConstants";
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
  const classes = usePlotStyles();

  const correspondingData = useMemo(
    () => datasets.find((set) => set.label === path?.value)?.data ?? [],
    [datasets, path?.value],
  );

  const [hoverComponentId] = useState<string>(() => uuidv4());
  const hoverValue = useHoverValue({
    componentId: hoverComponentId,
    isTimestampScale: true,
  });

  const theme = useTheme();
  const currentDisplay = useMemo(() => {
    const timeToCompare = hoverValue?.value ?? currentTime;

    let value;
    for (const pt of correspondingData) {
      if (timeToCompare == undefined || pt == undefined || pt.x > timeToCompare) {
        break;
      }
      value = pt.y;
    }
    return { value, color: hoverValue?.value != undefined ? theme.palette.yellowDark : "inherit" };
  }, [hoverValue, correspondingData, currentTime, theme.palette.yellowDark]);

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
    <div className={classes.item}>
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
          style={{
            color: path.enabled ? lineColors[index % lineColors.length] : "#777",
          }}
        />
      </div>
      <Flex style={{ justifyContent: "space-between" }}>
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
        <div>
          <span style={{ color: currentDisplay.color }}>{currentDisplay.value}</span>
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
      </Flex>
    </div>
  );
}
