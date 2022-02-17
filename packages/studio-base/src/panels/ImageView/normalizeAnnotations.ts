// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { filterMap } from "@foxglove/studio-base/../../den/collection";
import {
  ImageMarker,
  ImageMarkerArray,
  ImageMarkerType,
} from "@foxglove/studio-base/types/Messages";

import type { FoxgloveImageAnnotationsMessage, Annotation } from "./types";

function normalizeFoxgloveImageAnnotations(
  message: FoxgloveImageAnnotationsMessage,
): Annotation[] | undefined {
  if (!message.circles && !message.points) {
    return undefined;
  }

  if (message.circles?.length === 0 && message.points?.length === 0) {
    return undefined;
  }

  const annotations: Annotation[] = [];

  for (const circle of message.circles ?? []) {
    annotations.push({
      type: "circle",
    });
  }
  for (const point of message.points ?? []) {
    annotations.push({
      type: "points",
    });
  }

  return annotations;
}

function normalizeRosImageMarkerArray(message: ImageMarkerArray): Annotation[] | undefined {
  return filterMap(message.markers, (marker) => normalizeRosImageMarker(marker));
}

function normalizeRosImageMarker(message: ImageMarker): Annotation | undefined {
  switch (message.type) {
    case ImageMarkerType.CIRCLE:
      return {
        type: "circle",
      };
    case ImageMarkerType.TEXT:
      return {
        type: "text",
      };
    case ImageMarkerType.LINE_LIST:
    case ImageMarkerType.LINE_STRIP:
    case ImageMarkerType.POINTS:
    case ImageMarkerType.POLYGON:
      return {
        type: "points",
      };
  }

  return undefined;
}

function normalizeAnnotations(message: unknown, datatype: string): Annotation[] | undefined {
  switch (datatype) {
    // single marker
    case "visualization_msgs/ImageMarker":
    case "visualization_msgs/msg/ImageMarker":
    case "ros.visualization_msgs.ImageMarker": {
      const normalized = normalizeRosImageMarker(message as ImageMarker);
      if (normalized) {
        return [normalized];
      }
      break;
    }
    // marker arrays
    case "foxglove_msgs/ImageMarkerArray":
    case "foxglove_msgs/msg/ImageMarkerArray":
    case "studio_msgs/ImageMarkerArray":
    case "studio_msgs/msg/ImageMarkerArray":
    case "visualization_msgs/ImageMarkerArray":
    case "visualization_msgs/msg/ImageMarkerArray":
    case "ros.visualization_msgs.ImageMarkerArray":
      return normalizeRosImageMarkerArray(message as ImageMarkerArray);
    // backwards compat with webviz
    case "webviz_msgs/ImageMarkerArray":
      break;
    // foxglove
    case "foxglove.ImageAnnotations": {
      return normalizeFoxgloveImageAnnotations(message as FoxgloveImageAnnotationsMessage);
    }
  }

  return undefined;
}

export { normalizeAnnotations };
