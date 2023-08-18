// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import type { ChartData as AbstractChartData } from "chart.js";

import type {
  ObjectData,
  ChartData,
  TypedChartData,
  TypedData,
} from "@foxglove/studio-base/components/Chart/types";

// alias types for convenience
export type ChartDatasets = ChartData["datasets"];
export type ChartDataset = ChartDatasets[0];
export type ChartDatum = ChartDataset["data"][0];

export type TypedChartDatasets = TypedChartData["datasets"];
export type TypedChartDataset = TypedChartDatasets[0];

export type Bounds = {
  x: { min: number; max: number };
  y: { min: number; max: number };
};

export type View = {
  width: number;
  height: number;
  bounds: Bounds;
};

export type ProviderState<T> = {
  data: AbstractChartData<"scatter", T>;
  bounds: Bounds;
};
export type ChartProviderState = ProviderState<ObjectData>;
export type TypedProviderState = ProviderState<TypedData[]>;

export type ProviderStateSetter<T> = (state: ProviderState<T>) => void;

export type Provider<T> = {
  setView: (view: View) => void;
  register: (setter: ProviderStateSetter<T>, addPartial: ProviderStateSetter<T>) => void;
};

export type ChartDataProvider = Provider<ObjectData>;
export type TypedDataProvider = Provider<TypedData[]>;

export type { ChartData };
