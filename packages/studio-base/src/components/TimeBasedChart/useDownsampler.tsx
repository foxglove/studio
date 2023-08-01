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

import React, { useMemo, useCallback, useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";

import type { ObjectData, RpcScales } from "@foxglove/studio-base/components/Chart/types";

import { Downsampler } from "./Downsampler";
import { Provider, ProviderStateSetter, View, ChartDataset } from "./types";
import { getBounds } from "./useProvider";

export default function useDownsample(datasets: ChartDataset[]): {
  downsampler: Provider<ObjectData>;
  setScales: (scales: RpcScales) => void;
} {
  const [view, setView] = React.useState<View | undefined>();
  const [setter, setSetter] = React.useState<ProviderStateSetter<ObjectData> | undefined>();

  const register = React.useCallback((setter: ProviderStateSetter<ObjectData>) => {
    // lol
    setSetter(setter);
  }, []);

  const downsampler = useMemo(() => new Downsampler(), []);

  // Stable callback to run the downsampler and update the latest copy of the downsampled datasets
  const applyDownsample = useCallback(() => {
    if (setter == undefined) {
      return;
    }

    const datasets = downsampler.downsample();
    if (datasets == undefined) {
      return;
    }

    const bounds = getBounds(datasets);
    if (bounds == undefined) {
      return;
    }

    setter({
      bounds,
      data: {
        datasets,
      },
    });
  }, [setter, downsampler]);

  // Debounce calls to invoke the downsampler
  const queueDownsample = useDebouncedCallback(
    applyDownsample,
    100,
    // maxWait equal to debounce timeout makes the debounce act like a throttle
    // Without a maxWait - invocations of the debounced invalidate reset the countdown
    // resulting in no invalidation when scales are constantly changing (playback)
    { leading: false, maxWait: 100 },
  );

  const setScales = useCallback(
    (scales: RpcScales) => {
      downsampler.update({ scales });
      queueDownsample();
    },
    [downsampler, queueDownsample],
  );

  // Updates to the dataset bounds do not need to queue a downsample
  useEffect(() => {
    downsampler.update({ datasetBounds: view });
  }, [view, downsampler]);

  // Updates to the viewport or the datasets queue a downsample
  useEffect(() => {
    downsampler.update({ datasets });
    queueDownsample();
  }, [downsampler, datasets, queueDownsample]);

  return React.useMemo(() => {
    return {
      downsampler: {
        setView,
        register,
      },
      setScales,
    };
  }, [register, setScales]);
}
