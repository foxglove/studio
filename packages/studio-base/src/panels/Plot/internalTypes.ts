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

import { ScatterDataPoint } from "chart.js";

import { Time } from "@foxglove/rostime";
import { Immutable } from "@foxglove/studio";
import { MessagePathDataItem } from "@foxglove/studio-base/components/MessagePathSyntax/useCachedGetMessagePathDataItems";
import { MessageEvent } from "@foxglove/studio-base/players/types";
import { TimestampMethod } from "@foxglove/studio-base/util/time";

export type Messages = Record<string, MessageEvent[]>;

export type BasePlotPath = {
  value: string;
  enabled: boolean;
};

export type PlotPath = BasePlotPath & {
  color?: string;
  label?: string;
  timestampMethod: TimestampMethod;
  showLine?: boolean;
  lineSize?: number;
};
export type PlotDataByPath = Map<PlotPath, PlotDataItem[]>;

export type PlotXAxisVal =
  // x-axis is either receive time since start or header stamp since start
  | "timestamp"
  // The message path values from the latest message for each series. The x-axis is the array
  // "index" of the item and y-axis is the item value
  | "index"
  // The x-axis are values from message path items (accumulated). Each series produces y-values from
  // its message path items. The x/y values are paired by their respective array index locations.
  | "custom"
  // Similar to "index" mode except the x-axis the message path item values and the y-axis are the
  // correspondible series message path value at the same array index. Only the latest message is used
  // for x-axis and each series
  | "currentCustom";

export type OriginalValue = string | bigint | number | boolean | Time;

// In addition to the base datum, we also add receiveTime and optionally header stamp to our datums
// These are used in the csv export.
export type Datum = ScatterDataPoint & {
  value: OriginalValue;
  receiveTime: Time;
  headerStamp?: Time;
};

export type PlotDataItem = {
  queriedData: MessagePathDataItem[];
  receiveTime: Time;
  headerStamp?: Time;
};

export type PlotParams = {
  startTime: Time;
  paths: readonly PlotPath[];
  invertedTheme?: boolean;
  xAxisPath?: BasePlotPath;
  xAxisVal: PlotXAxisVal;
  followingViewWidth: number | undefined;
  minXValue: number | undefined;
  maxXValue: number | undefined;
  minYValue: string | number | undefined;
  maxYValue: string | number | undefined;
};

/**
 * A "reference line" plot path is a numeric value. It creates a horizontal line on the plot at the
 * specified value.
 * @returns true if the series config is a reference line
 */
export function isReferenceLinePlotPathType(path: Immutable<PlotPath>): boolean {
  return !isNaN(Number.parseFloat(path.value));
}
