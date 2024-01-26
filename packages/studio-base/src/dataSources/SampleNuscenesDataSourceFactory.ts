// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  IDataSourceFactory,
  DataSourceFactoryInitializeArgs,
} from "@foxglove/studio-base/context/PlayerSelectionContext";
import {
  IterablePlayer,
  WorkerIterableSource,
  BufferedIterableSource,
  DeserializingBufferedIterableSource,
  DeserializingIterableSource,
} from "@foxglove/studio-base/players/IterablePlayer";

import SampleNuscenesLayout from "./SampleNuscenesLayout.json";

class SampleNuscenesDataSourceFactory implements IDataSourceFactory {
  public id = "sample-nuscenes";
  public type: IDataSourceFactory["type"] = "sample";
  public displayName = "Sample: Nuscenes";
  public iconName: IDataSourceFactory["iconName"] = "FileASPX";
  public hidden = true;
  public sampleLayout = SampleNuscenesLayout as IDataSourceFactory["sampleLayout"];

  public initialize(
    args: DataSourceFactoryInitializeArgs,
  ): ReturnType<IDataSourceFactory["initialize"]> {
    const bagUrl = "https://assets.foxglove.dev/NuScenes-v1.0-mini-scene-0061-df24c12.mcap";

    const workerSource = new WorkerIterableSource<Uint8Array>({
      initWorker: () => {
        return new Worker(
          // foxglove-depcheck-used: babel-plugin-transform-import-meta
          new URL(
            "@foxglove/studio-base/players/IterablePlayer/Mcap/McapIterableSourceWorker.worker",
            import.meta.url,
          ),
        );
      },
      initArgs: { url: bagUrl },
    });

    const GIGABYTE_IN_BYTES = 1024 * 1024 * 1024;
    const rawBufferedSource = new BufferedIterableSource<Uint8Array>(workerSource, {
      readAheadDuration: { sec: 120, nsec: 0 },
      maxCacheSizeBytes: 2 * GIGABYTE_IN_BYTES,
    });

    const source = new DeserializingIterableSource(workerSource);
    const bufferedSource = new DeserializingBufferedIterableSource(rawBufferedSource);

    return new IterablePlayer({
      source,
      bufferedSource,
      isSampleDataSource: true,
      name: "Adapted from nuScenes dataset. Copyright © 2020 nuScenes. https://www.nuscenes.org/terms-of-use",
      metricsCollector: args.metricsCollector,
      // Use blank url params so the data source is set in the url
      urlParams: {},
      sourceId: this.id,
    });
  }
}

export default SampleNuscenesDataSourceFactory;
