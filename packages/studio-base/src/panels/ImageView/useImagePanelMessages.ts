// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useCallback, useMemo } from "react";

import { AVLTree } from "@foxglove/avl";
import { Time, compare as compareTime, isLessThan } from "@foxglove/rostime";
import { MessageEvent } from "@foxglove/studio";
import { useShallowMemo } from "@foxglove/studio-base/../../hooks/src";
import { useMessageReducer } from "@foxglove/studio-base/PanelAPI";

import { normalizeAnnotations } from "./normalizeAnnotations";
import { NormalizedImageMessage, normalizeImageMessage } from "./normalizeMessage";
import { Annotation } from "./types";
import { useDatatypesByTopic } from "./useDatatypesByTopic";

type ImagePanelMessages = {
  image?: NormalizedImageMessage;
  annotations?: Annotation[];
};

type ReducerState = {
  image?: NormalizedImageMessage;
  annotations?: Annotation[];

  tree: AVLTree<Time, ImagePanelMessages>;
};

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

type Options = {
  imageTopic: string;
  annotationTopics: string[];
  synchronize: boolean;
};

function syncrhonizedAddMessage(
  state: ReducerState,
  image?: NormalizedImageMessage,
  annotations?: Annotation[],
): ReducerState {
  // Update the image at the stamp time
  if (image) {
    const item = state.tree.get(image.stamp) ?? {};
    item.image = image;
    state.tree.set(image.stamp, item);
  }

  // Update annotations at the stamp time
  if (annotations) {
    for (const annotation of annotations) {
      const item = state.tree.get(annotation.stamp) ?? {};
      item.annotations ??= [];
      item.annotations.push(annotation);
      state.tree.set(annotation.stamp, item);
    }
  }

  // Find the oldest entry where we have images and annotations
  // We can display this to the user
  let validEntry: [Time, ImagePanelMessages] | undefined = undefined;
  for (const entry of state.tree.entries()) {
    const messageState = entry[1];
    if (messageState.image && messageState.annotations) {
      validEntry = entry;
    }
  }

  // We've got a set of synchronized messages, remove any older items from the tree
  if (validEntry) {
    let minKey = state.tree.minKey();
    while (minKey && isLessThan(minKey, validEntry[0])) {
      state.tree.shift();

      minKey = state.tree.minKey();
    }

    return {
      image: validEntry[1].image,
      annotations: validEntry[1].annotations,
      tree: state.tree,
    };
  }

  // with no valid entry, we keep the previous state
  return state;
}

function useImagePanelMessages(options?: Options): ImagePanelMessages {
  const { imageTopic, annotationTopics, synchronize = false } = options ?? {};

  const topics = useMemo(() => {
    const out: string[] = [];
    if (imageTopic) {
      out.push(imageTopic);
    }
    if (annotationTopics) {
      out.push(...annotationTopics);
    }
    return out;
  }, [annotationTopics, imageTopic]);

  const shallowTopics = useShallowMemo(topics);

  const datatypesByTopic = useDatatypesByTopic();

  // fixme - when topics change should we clear the state?
  // its weird to remove the image if the marker topic is toggled on/off
  // but also weird to not if the image topic changes
  const restore = useCallback((state?: ReducerState) => {
    return (
      state ?? {
        tree: new AVLTree<Time, ImagePanelMessages>(compareTime),
      }
    );
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

      if (!synchronize) {
        return {
          image: normalizedImage ?? state.image,
          annotations: normalizedAnnotations ?? state.annotations,
          tree: state.tree,
        };
      }

      return syncrhonizedAddMessage(state, normalizedImage, normalizedAnnotations);
    },
    [datatypesByTopic, synchronize],
  );

  const { image, annotations } = useMessageReducer({
    topics: shallowTopics,
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
