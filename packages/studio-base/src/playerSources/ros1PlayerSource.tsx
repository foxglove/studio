// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useEffect, useMemo } from "react";
import { useAsync } from "react-use";

import { AppSetting } from "@foxglove/studio-base/AppSetting";
import OsContextSingleton from "@foxglove/studio-base/OsContextSingleton";
import { useAnalytics } from "@foxglove/studio-base/context/AnalyticsContext";
import {
  PlayerSourceDefinition,
  usePlayerSelection,
} from "@foxglove/studio-base/context/PlayerSelectionContext";
import { useAppConfigurationValue } from "@foxglove/studio-base/hooks/useAppConfigurationValue";
import { usePrompt } from "@foxglove/studio-base/hooks/usePrompt";
import AnalyticsMetricsCollector from "@foxglove/studio-base/players/AnalyticsMetricsCollector";
import Ros1Player from "@foxglove/studio-base/players/Ros1Player";
import { AppError } from "@foxglove/studio-base/util/errors";
import { parseInputUrl } from "@foxglove/studio-base/util/url";

// fixme - should this move to Desktop?
function SelectionPanel(): JSX.Element {
  const prompt = usePrompt();

  const [rosHostname] = useAppConfigurationValue<string>(AppSetting.ROS1_ROS_HOSTNAME);

  // fixme - should this be done via onPlayer prop instead of hook?
  const { selectSource } = usePlayerSelection();

  // fixme - should this be here?
  const analytics = useAnalytics();
  const metricsCollector = useMemo(() => {
    return new AnalyticsMetricsCollector(analytics);
  }, [analytics]);

  const { value: url } = useAsync(async () => {
    return await prompt({
      title: "ROS 1 TCP connection",
      placeholder: "localhost:11311",
      value: OsContextSingleton?.getEnvVar("ROS_MASTER_URI") ?? "localhost:11311",
      transformer: (str) => {
        const result = parseInputUrl(str, "ros:", {
          "http:": { port: 80 },
          "https:": { port: 443 },
          "ros:": { protocol: "http:", port: 11311 },
        });
        if (result == undefined) {
          throw new AppError(
            "Invalid ROS URL. See the ROS_MASTER_URI at http://wiki.ros.org/ROS/EnvironmentVariables for more info.",
          );
        }
        return result;
      },
    });
  });

  useEffect(() => {
    if (url == undefined) {
      return;
    }

    selectSource(new Ros1Player({ url, hostname: rosHostname, metricsCollector }));
  }, [metricsCollector, rosHostname, selectSource, url]);

  return <></>;
}

const ros1PlayerSource: PlayerSourceDefinition = {
  id: "ros1-socket",
  name: "ROS 1",
  component: SelectionPanel,
};

export default ros1PlayerSource;
