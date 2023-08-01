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

import * as React from "react";
import { ChartDataset, ChartData } from "chart.js";

import type { ObjectData, TypedData } from "@foxglove/studio-base/components/Chart/types";

import { Provider, ProviderState, Bounds, View } from "./types";

type Datasets<T> = ChartDataset<"scatter", T>[];
type Data<T> = ChartData<"scatter", T>;

export function getBounds(data: Datasets<ObjectData>): Bounds | undefined {
  let xMin: number | undefined;
  let xMax: number | undefined;
  let yMin: number | undefined;
  let yMax: number | undefined;

  for (const dataset of data) {
    for (const item of dataset.data) {
      if (item == undefined) {
        continue;
      }
      if (!isNaN(item.x)) {
        xMin = Math.min(xMin ?? item.x, item.x);
        xMax = Math.max(xMax ?? item.x, item.x);
      }

      if (!isNaN(item.x)) {
        yMin = Math.min(yMin ?? item.y, item.y);
        yMax = Math.max(yMax ?? item.y, item.y);
      }
    }
  }

  if (xMin == undefined || xMax == undefined || yMin == undefined || yMax == undefined) {
    return undefined;
  }

  return { x: { min: xMin, max: xMax }, y: { min: yMin, max: yMax } };
}

export function getTypedBounds(data: Datasets<TypedData[]>): Bounds | undefined {
  let xMin: number | undefined;
  let xMax: number | undefined;
  let yMin: number | undefined;
  let yMax: number | undefined;

  for (const dataset of data) {
    const { data: slices } = dataset;
    for (const slice of slices) {
      for (let i = 0; i < slice.x.length; i++) {
        const x = slice.x[i];
        const y = slice.y[i];

        if (x == undefined || y == undefined) {
          continue;
        }

        if (!isNaN(x)) {
          xMin = Math.min(xMin ?? x, x);
          xMax = Math.max(xMax ?? x, x);
        }

        if (!isNaN(y)) {
          yMin = Math.min(yMin ?? y, y);
          yMax = Math.max(yMax ?? y, y);
        }
      }
    }
  }

  if (xMin == undefined || xMax == undefined || yMin == undefined || yMax == undefined) {
    return undefined;
  }

  return { x: { min: xMin, max: xMax }, y: { min: yMin, max: yMax } };
}

export default function useProvider<T>(
  view: View,
  // Calculates the bounds of the given datasets.
  getBounds: (data: Datasets<T>) => Bounds | undefined,
  data: Data<T> | undefined,
  provider: Provider<T> | undefined,
): ProviderState<T> | undefined {
  const [state, setState] = React.useState<ProviderState<T> | undefined>();

  React.useEffect(() => {
    if (provider == undefined) {
      return;
    }
    provider.register(setState);
  }, [provider]);

  React.useEffect(() => {
    if (provider == undefined) {
      return;
    }
    provider.setView(view);
  }, [view]);

  return React.useMemo(() => {
    if (data != undefined) {
      const bounds = getBounds(data.datasets);
      if (bounds == undefined) {
        return undefined;
      }

      return {
        bounds,
        data,
      };
    }

    return state;
  }, [data, state]);
}
