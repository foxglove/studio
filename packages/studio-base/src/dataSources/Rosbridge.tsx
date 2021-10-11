// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { DataSource } from "@foxglove/studio-base/context/PlayerSelectionContext";
import { PromptOptions } from "@foxglove/studio-base/hooks/usePrompt";
import NoopMetricsCollector from "@foxglove/studio-base/players/NoopMetricsCollector";
import RosbridgePlayer from "@foxglove/studio-base/players/RosbridgePlayer";
import { Player } from "@foxglove/studio-base/players/types";
import { parseInputUrl } from "@foxglove/studio-base/util/url";

class Rosbridge implements DataSource {
  id = "rosbridge-websockete";
  displayName = "Rosbridge (ROS 1 & 2)";
  iconName = "Flow";

  promptOptions(previousValue?: string): PromptOptions {
    return {
      title: "WebSocket connection",
      placeholder: "ws://localhost:9090",
      initialValue: previousValue ?? "ws://localhost:9090",
      transformer: (str) => {
        const result = parseInputUrl(str, "http:", {
          "http:": { protocol: "ws:", port: 9090 },
          "https:": { protocol: "wss:", port: 9090 },
          "ws:": { port: 9090 },
          "wss:": { port: 9090 },
          "ros:": { protocol: "ws:", port: 9090 },
        });
        if (result == undefined) {
          throw new Error("Invalid rosbridge WebSocket URL. Use the ws:// or wss:// protocol.");
        }
        return result;
      },
    };
  }

  initialize(args?: Record<string, unknown>): Player | undefined {
    const url = args?.["url"] as string | undefined;
    if (!url) {
      return;
    }

    // fixme
    const metrics = new NoopMetricsCollector();
    return new RosbridgePlayer({
      url,
      metricsCollector: metrics,
    });
  }
}

export default Rosbridge;
