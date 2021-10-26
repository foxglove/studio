// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  IPlayerFactory,
  PlayerFactoryInitializeArgs,
} from "@foxglove/studio-base/context/PlayerSelectionContext";
import { buildRosbag2PlayerFromDescriptor } from "@foxglove/studio-base/players/buildRosbag2Player";
import { Player } from "@foxglove/studio-base/players/types";
import { getLocalRosbag2Descriptor } from "@foxglove/studio-base/randomAccessDataProviders/standardDataProviderDescriptors";

class Ros2LocalBagPlayerFactory implements IPlayerFactory {
  id = "ros2-local-bagfile";
  displayName = "ROS 2 Bag (local)";
  iconName: IPlayerFactory["iconName"] = "OpenFolder";

  supportsOpenDirectory = true;

  initialize(args: PlayerFactoryInitializeArgs): Player | undefined {
    const folder = args.folder;
    if (!folder) {
      return;
    }

    return buildRosbag2PlayerFromDescriptor(getLocalRosbag2Descriptor(folder), {
      metricsCollector: args.metricsCollector,
      unlimitedMemoryCache: args.unlimitedMemoryCache,
    });
  }
}

export default Ros2LocalBagPlayerFactory;
