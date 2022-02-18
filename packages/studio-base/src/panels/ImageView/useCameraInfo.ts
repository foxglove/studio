// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useCallback, useMemo } from "react";

import { MessageEvent } from "@foxglove/studio";
import { useMessageReducer, useDataSourceInfo } from "@foxglove/studio-base/PanelAPI";
import { CameraInfo, DistortionModel } from "@foxglove/studio-base/types/Messages";

import type { FoxgloveCameraCalibration } from "./types";
import { getCameraInfoTopic } from "./util";

function normalizeCameraInfo(message: unknown, datatype: string): CameraInfo | undefined {
  switch (datatype) {
    case "sensor_msgs/CameraInfo":
    case "sensor_msgs/msg/CameraInfo":
      return message as CameraInfo;
    case "foxglove.CameraCalibration": {
      const typedMessage = message as FoxgloveCameraCalibration;
      return {
        width: typedMessage.width,
        height: typedMessage.height,
        distortion_model: (typedMessage.distortion_model ?? "") as DistortionModel,
        D: typedMessage.D ?? [],
        K: typedMessage.K ?? [],
        P: typedMessage.P ?? [],
        R: typedMessage.R ?? [],
        binning_x: 1,
        binning_y: 1,
        roi: { x_offset: 0, y_offset: 0, width: 0, height: 0, do_rectify: false },
      };
    }
  }

  return undefined;
}

export function useCameraInfo(cameraTopic: string): CameraInfo | undefined {
  const { topics } = useDataSourceInfo();

  const { cameraInfoTopics, datatype } = useMemo(() => {
    const cameraInfoTopic = getCameraInfoTopic(cameraTopic);
    if (!cameraInfoTopic) {
      return { cameraInfoTopics: [], datatype: "" };
    }

    for (const topic of topics) {
      if (topic.name === cameraInfoTopic) {
        return { cameraInfoTopics: [cameraInfoTopic], datatype: topic.datatype };
      }
    }

    return { cameraInfoTopics: [], datatype: "" };
  }, [cameraTopic, topics]);

  return useMessageReducer<CameraInfo | undefined>({
    topics: cameraInfoTopics,
    restore: useCallback((value) => value, []),
    addMessage: useCallback(
      (_value: CameraInfo | undefined, { message }: MessageEvent<unknown>) => {
        return normalizeCameraInfo(message, datatype);
      },
      [datatype],
    ),
  });
}
