// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { DataSource } from "@foxglove/studio-base/context/PlayerSelectionContext";
import { PromptOptions } from "@foxglove/studio-base/hooks/usePrompt";
import NoopMetricsCollector from "@foxglove/studio-base/players/NoopMetricsCollector";
import Ros2Player from "@foxglove/studio-base/players/Ros2Player";
import { Player } from "@foxglove/studio-base/players/types";

class Ros2Socket implements DataSource {
  id = "ros2-socket";
  displayName = "ROS 2";
  iconName = "studio.ROS";

  promptOptions(previousValue?: string): PromptOptions {
    return {
      title: "ROS 2 DomainId",
      placeholder: "0",
      initialValue: previousValue ?? "0",
      transformer: (str) => {
        const result = parseInt(str);
        if (isNaN(result) || result < 0) {
          throw new Error("Invalid ROS 2 DomainId. Please use a non-negative integer");
        }
        return String(result);
      },
    };
  }

  initialize(args?: Record<string, unknown>): Player | undefined {
    const url = args?.["url"] as string | undefined;
    if (!url) {
      return;
    }

    const domainIdStr = url;
    const domainId = parseInt(domainIdStr);

    // fixme
    const metrics = new NoopMetricsCollector();
    return new Ros2Player({ domainId, metricsCollector: metrics });
  }
}

export default Ros2Socket;
