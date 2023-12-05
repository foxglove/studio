// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { iterateObjects } from "@foxglove/studio-base/components/Chart/datasets";
import { RpcScales } from "@foxglove/studio-base/components/Chart/types";
import { grey } from "@foxglove/studio-base/util/toolsColorScheme";

import { downsampleStates, MAX_POINTS } from "./downsample";
import { ChartDatasets, PlotViewport } from "./types";

type UpdateParams = {
  datasets?: ChartDatasets;
  datasetBounds?: PlotViewport;
  scales?: RpcScales;
};

/**
 * Track a dataset, some bounds, a viewport to perform downsampling
 */
export class Downsampler {
  #datasets: ChartDatasets = [];
  #datasetBounds?: PlotViewport;
  #scales?: RpcScales;

  /**
   * Update internal state for next downsample
   */
  public update(opt: UpdateParams): void {
    this.#datasets = opt.datasets ?? this.#datasets;
    this.#datasetBounds = opt.datasetBounds ?? this.#datasetBounds;
    this.#scales = opt.scales ?? this.#scales;
  }

  /**
   * Perform a downsample with the latest state
   */
  public downsample(): ChartDatasets | undefined {
    const width = this.#datasetBounds?.width;
    const height = this.#datasetBounds?.height;

    const currentScales = this.#scales;
    let view: PlotViewport | undefined = undefined;
    if (currentScales?.x && currentScales.y) {
      view = {
        width: width ?? 0,
        height: height ?? 0,
        bounds: {
          x: {
            min: currentScales.x.min,
            max: currentScales.x.max,
          },
          y: {
            min: currentScales.y.min,
            max: currentScales.y.max,
          },
        },
      };
    }

    if (this.#datasetBounds == undefined) {
      return undefined;
    }

    const numPoints = MAX_POINTS / Math.max(this.#datasets.length, 1);
    return this.#datasets.map((dataset) => {
      if (!view) {
        return dataset;
      }

      const downsampled = downsampleStates(iterateObjects(dataset.data), view, numPoints);
      const resolved = downsampled.map(([index, numStates]) => {
        const point = dataset.data[index];
        if (point == undefined || numStates === 1) {
          return point;
        }

        return {
          ...point,
          labelColor: grey,
          label: undefined,
        };
      });

      // NaN item values create gaps in the line
      const undefinedToNanData = resolved.map((item) => {
        if (item == undefined || isNaN(item.x) || isNaN(item.y)) {
          return { x: NaN, y: NaN, value: NaN };
        }
        return item;
      });

      return { ...dataset, data: undefinedToNanData };
    });
  }
}
