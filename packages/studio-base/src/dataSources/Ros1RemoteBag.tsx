// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { DataSource } from "@foxglove/studio-base/context/PlayerSelectionContext";
import { PromptOptions } from "@foxglove/studio-base/hooks/usePrompt";
import NoopMetricsCollector from "@foxglove/studio-base/players/NoopMetricsCollector";
import { buildPlayerFromBagURLs } from "@foxglove/studio-base/players/buildPlayer";
import { Player } from "@foxglove/studio-base/players/types";
import { parseInputUrl } from "@foxglove/studio-base/util/url";

class Ros1RemoteBag implements DataSource {
  id = "ros1-remote-bagfile";
  displayName = "ROS 1 Bag (remote)";
  iconName = "FileASPX";

  promptOptions(previousValue?: string): PromptOptions {
    return {
      title: "Remote bag file",
      placeholder: "https://example.com/file.bag",
      initialValue: previousValue,
      transformer: (str) => {
        const result = parseInputUrl(str, "https:", {
          "http:": { port: 80 },
          "https:": { port: 443 },
          "ftp:": { port: 21 },
        });
        if (result == undefined) {
          throw new Error(
            "Invalid bag URL. Use a http:// or https:// URL of a web hosted bag file.",
          );
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
    return buildPlayerFromBagURLs([url], {
      // fixme - where to get this from? app settings?
      unlimitedMemoryCache: false,
      metricsCollector: metrics,
    });
  }
}

export default Ros1RemoteBag;
