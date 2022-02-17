// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useCallback, useMemo } from "react";

import { MessageEvent } from "@foxglove/studio";
import { useDataSourceInfo, useMessageReducer } from "@foxglove/studio-base/PanelAPI";

import { normalizeAnnotations } from "./normalizeAnnotations";
import { NormalizedImageMessage, normalizeImageMessage } from "./normalizeMessage";
import { Annotation } from "./types";

type ImagePanelMessages = {
  image?: NormalizedImageMessage;
  annotations?: Annotation[];
};

type ReducerState = {
  image?: NormalizedImageMessage;
  annotations?: Annotation[];
};

function useDatatypesByTopic(): Map<string, string> {
  const { topics } = useDataSourceInfo();

  return useMemo(() => {
    const out = new Map<string, string>();
    for (const topic of topics) {
      out.set(topic.name, topic.datatype);
    }
    return out;
  }, [topics]);
}

export const ANNOTATION_DATATYPES = [
  // Single marker
  "visualization_msgs/ImageMarker",
  "visualization_msgs/msg/ImageMarker",
  "ros.visualization_msgs.ImageMarker",
  // Marker arrays
  "foxglove_msgs/ImageMarkerArray",
  "foxglove_msgs/msg/ImageMarkerArray",
  "studio_msgs/ImageMarkerArray",
  "studio_msgs/msg/ImageMarkerArray",
  "visualization_msgs/ImageMarkerArray",
  "visualization_msgs/msg/ImageMarkerArray",
  "ros.visualization_msgs.ImageMarkerArray",
  // backwards compat with webviz
  "webviz_msgs/ImageMarkerArray",
  // foxglove
  "foxglove.ImageAnnotations",
];

function useImagePanelMessages(): ImagePanelMessages {
  // when not synchronizing, we keep the latest message on each topic
  // when synchronizing, the returned messages are only those that match

  const topics: string[] = [];

  const datatypesByTopic = useDatatypesByTopic();

  const restore = useCallback((state?: ReducerState) => {
    return state ?? {};
  }, []);

  const addMessage = useCallback(
    (state: ReducerState, event: MessageEvent<unknown>): ReducerState => {
      // A datatype is required to normalize the message
      const datatype = datatypesByTopic.get(event.topic);
      if (!datatype) {
        return state;
      }

      const normalizedImage = normalizeImageMessage(event.message, datatype);
      const normalizedAnnotations = normalizeAnnotations(event.message, datatype);

      if (!normalizedImage && !normalizedAnnotations) {
        return state;
      }

      return {
        image: normalizedImage ?? state.image,
        annotations: normalizedAnnotations ?? state.annotations,
      };
    },
    [datatypesByTopic],
  );

  const { image, annotations } = useMessageReducer({
    topics,
    restore,
    addMessage,
  });

  return useMemo(() => {
    return {
      image,
      annotations,
    };
  }, [annotations, image]);
}

export { useImagePanelMessages };
