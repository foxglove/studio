// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  IDataSourceFactory,
  DataSourceFactoryInitializeArgs,
} from "@foxglove/studio-base/context/PlayerSelectionContext";
import { IterablePlayer } from "@foxglove/studio-base/players/IterablePlayer";
import { McapIterableSource } from "@foxglove/studio-base/players/IterablePlayer/Mcap/McapIterableSource";
import { Player } from "@foxglove/studio-base/players/types";

export default class McapRemoteDataSourceFactory implements IDataSourceFactory {
  id = "mcap-remote-file";
  type: IDataSourceFactory["type"] = "remote-file";
  displayName = "MCAP";
  iconName: IDataSourceFactory["iconName"] = "FileASPX";
  supportedFileTypes = [".mcap"];
  description = "Fetch and load pre-recorded MCAP files from a remote location.";
  docsLink = "https://foxglove.dev/docs/studio/connection/mcap";

  initialize(args: DataSourceFactoryInitializeArgs): Player | undefined {
    const url = args.url;
    if (!url) {
      return;
    }

    const source = new McapIterableSource({ type: "url", url });
    return new IterablePlayer({
      metricsCollector: args.metricsCollector,
      source,
      name: url,
      sourceId: this.id,
    });
  }
}
