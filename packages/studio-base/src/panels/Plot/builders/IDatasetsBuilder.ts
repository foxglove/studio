// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import type { Immutable, Time } from "@foxglove/studio";
import type { Bounds1D } from "@foxglove/studio-base/components/TimeBasedChart/types";
import { GlobalVariables } from "@foxglove/studio-base/hooks/useGlobalVariables";
import type { PlayerState } from "@foxglove/studio-base/players/types";

import type { Dataset } from "../ChartRenderer";
import { OriginalValue } from "../datum";
import { PlotConfig } from "../types";

type CsvDatum = {
  x: number;
  y: number;
  receiveTime: Time;
  headerStamp?: Time;
  value: OriginalValue;
};

type Size = { width: number; height: number };

export type Viewport = {
  /**
   * The data bounds of the viewport. The bounds hint which data will be visible to the user. When
   * undefined, assumes that all data is visible in the viewport.
   */
  bounds: {
    x?: Partial<Bounds1D>;
    y?: Partial<Bounds1D>;
  };
  /** The pixel size of the viewport */
  size: Size;
};

export type CsvDataset = {
  label: string;
  data: CsvDatum[];
};

export type GetViewportDatasetsResult = {
  datasets: Dataset[];
  pathsWithMismatchedDataLengths: ReadonlySet<string>;
};

/**
 * IDatasetBuilder defines methods for updating the building a dataset.
 *
 * Dataset updates (via new player state, and config) are syncronous and the callers do not expect
 * to wait on any promise. While getting the viewport datasets and csv data are async to allow them
 * to happen on a worker.
 */
interface IDatasetsBuilder {
  handlePlayerState(state: Immutable<PlayerState>): Bounds1D | undefined;

  setConfig(
    config: Immutable<PlotConfig>,
    colorScheme: "light" | "dark",
    globalVariables: GlobalVariables,
  ): void;

  getViewportDatasets(viewport: Immutable<Viewport>): Promise<GetViewportDatasetsResult>;

  getCsvData(): Promise<CsvDataset[]>;

  destroy(): void;
}

export type { IDatasetsBuilder };
