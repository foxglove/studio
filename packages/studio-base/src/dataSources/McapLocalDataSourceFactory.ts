// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  IDataSourceFactory,
  DataSourceFactoryInitializeArgs,
} from "@foxglove/studio-base/context/PlayerSelectionContext";
import { IterablePlayer, WorkerIterableSource } from "@foxglove/studio-base/players/IterablePlayer";
import { BufferedIterableSource } from "@foxglove/studio-base/players/IterablePlayer/BufferedIterableSource";
import { DeserializingBufferedIterableSource } from "@foxglove/studio-base/players/IterablePlayer/DeserializingBufferedIterableSource";
import { DeserializingIterableSource } from "@foxglove/studio-base/players/IterablePlayer/DeserializingIterableSource";
import { Player } from "@foxglove/studio-base/players/types";

const GIGABYTE_IN_BYTES = 1024 * 1024 * 1024;

class McapLocalDataSourceFactory implements IDataSourceFactory {
  public id = "mcap-local-file";
  public type: IDataSourceFactory["type"] = "file";
  public displayName = "MCAP";
  public iconName: IDataSourceFactory["iconName"] = "OpenFile";
  public supportedFileTypes = [".mcap"];

  public initialize(args: DataSourceFactoryInitializeArgs): Player | undefined {
    const file = args.file;
    if (!file) {
      return;
    }

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
      initArgs: { file },
    });

    const rawBufferedSource = new BufferedIterableSource<Uint8Array>(workerSource, {
      readAheadDuration: { sec: 60, nsec: 0 },
      maxCacheSizeBytes: 2 * GIGABYTE_IN_BYTES,
    });
    const source = new DeserializingIterableSource(workerSource);
    const bufferedSource = new DeserializingBufferedIterableSource(rawBufferedSource);

    return new IterablePlayer({
      metricsCollector: args.metricsCollector,
      source,
      bufferedSource,
      name: file.name,
      sourceId: this.id,
    });
  }
}

export default McapLocalDataSourceFactory;
