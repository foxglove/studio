// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as R from "ramda";

import { RpcScales } from "@foxglove/studio-base/components/Chart/types";
import { iterateNormal } from "@foxglove/studio-base/components/Chart/datasets";

import { downsample } from "./downsample";
import { ChartDatasets, View } from "./types";

type UpdateParams = {
  datasets?: ChartDatasets;
  datasetBounds?: View;
  scales?: RpcScales;
};

/**
 * Track a dataset, some bounds, a viewport to perform downsampling
 */
export class Downsampler {
  #datasets: ChartDatasets = [];
  #datasetBounds?: View;
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
    const height = this.#datasetBounds?.width;

    const currentScales = this.#scales;
    let bounds:
      | {
          width: number;
          height: number;
          x: { min: number; max: number };
          y: { min: number; max: number };
        }
      | undefined = undefined;
    if (currentScales?.x && currentScales.y) {
      bounds = {
        width: width ?? 0,
        height: height ?? 0,
        x: {
          min: currentScales.x.min,
          max: currentScales.x.max,
        },
        y: {
          min: currentScales.y.min,
          max: currentScales.y.max,
        },
      };
    }

    const dataBounds = this.#datasetBounds;
    if (!dataBounds) {
      return undefined;
    }

    const { bounds: providedBounds } = dataBounds;

    // if we don't have bounds (chart not initialized) but do have dataset bounds
    // then setup bounds as x/y min/max around the dataset values rather than the scales
    if (
      !bounds &&
      providedBounds.x.min != undefined &&
      providedBounds.x.max != undefined &&
      providedBounds.y.min != undefined &&
      providedBounds.y.max != undefined
    ) {
      bounds = {
        width: width ?? 0,
        height: height ?? 0,
        x: {
          min: providedBounds.x.min,
          max: providedBounds.x.max,
        },
        y: {
          min: providedBounds.y.min,
          max: providedBounds.y.max,
        },
      };
    }

    // If we don't have any bounds - we assume the component is still initializing and return no data
    // The other alternative is to return the full data set. This leads to rendering full fidelity data
    // which causes render pauses and blank charts for large data sets.
    if (!bounds) {
      return undefined;
    }

    const view: View = {
      width: 0,
      height: 0,
      bounds,
    };

    return this.#datasets.map((dataset) => {
      if (!bounds) {
        return dataset;
      }

      const downsampled = downsample(iterateNormal, dataset, view);
      const resolved = R.map((i) => dataset.data[i], downsampled);

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
