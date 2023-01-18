// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useState } from "react";
import { createStore, useStore } from "zustand";

import { AVLTree } from "@foxglove/avl";
import { Time, compare as compareTime } from "@foxglove/rostime";
import { MessageEvent, RenderState } from "@foxglove/studio";

import { normalizeAnnotations } from "../lib/normalizeAnnotations";
import { normalizeImageMessage } from "../lib/normalizeMessage";
import { Annotation, NormalizedImageMessage } from "../types";
import { synchronizedAddMessages } from "./synchronizedAddMessages";

export type ImagePanelState = {
  imageTopic?: string;
  annotationTopics: string[];
  image?: NormalizedImageMessage;
  annotationsByTopic: Map<string, Annotation[]>;
  tree: AVLTree<Time, SynchronizationItem>;
  synchronize: boolean;

  actions: {
    setCurrentFrame(currentFrame: NonNullable<RenderState["currentFrame"]>): void;
    clear(): void;
    setSynchronize(synchronize: boolean): void;
    setImageTopic(newTopic: string): void;
    setAnnotationTopics(newTopics: string[]): void;
  };
};

type PublicState = {
  image?: NormalizedImageMessage;
  annotations: readonly Annotation[];
} & ImagePanelState["actions"];

const selectPublicState = (state: ImagePanelState): PublicState => ({
  ...state.actions,
  image: state.image,
  annotations: ([] as Annotation[]).concat(...state.annotationsByTopic.values()),
});

export type SynchronizationItem = {
  image?: NormalizedImageMessage;
  annotationsByTopic: Map<string, Annotation[]>;
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
  "foxglove_msgs/ImageAnnotations",
  "foxglove_msgs/msg/ImageAnnotations",
  "foxglove.ImageAnnotations",
] as const;

function addMessages(
  state: ImagePanelState,
  messageEvents: readonly MessageEvent<unknown>[],
): Partial<ImagePanelState> {
  if (state.synchronize && state.annotationTopics.length > 0) {
    return synchronizedAddMessages(state, messageEvents);
  }

  let newState: Pick<ImagePanelState, "image" | "annotationsByTopic"> | undefined;
  for (const event of messageEvents) {
    const normalizedImage = normalizeImageMessage(event.message, event.schemaName);
    const normalizedAnnotations = normalizeAnnotations(event.message, event.schemaName);
    if (!normalizedImage && !normalizedAnnotations) {
      continue;
    }

    if (!newState) {
      newState = {
        image: state.image,
        annotationsByTopic: new Map(state.annotationsByTopic),
      };
    }

    if (normalizedImage) {
      newState.image = normalizedImage;
    }
    if (normalizedAnnotations) {
      newState.annotationsByTopic.set(event.topic, normalizedAnnotations);
    }
  }

  return newState ?? state;
}

export function useImagePanelMessages(initialState: {
  imageTopic: string;
  annotationTopics: string[];
  synchronize: boolean;
}): ImagePanelState["actions"] {
  const [store] = useState(() =>
    createStore<ImagePanelState>((set) => ({
      imageTopic: initialState.imageTopic,
      annotationTopics: initialState.annotationTopics,
      annotationsByTopic: new Map(),
      tree: new AVLTree(compareTime),
      synchronize: initialState.synchronize,

      actions: {
        setImageTopic(imageTopic) {
          // When changing image topics, clear the image and any annotations
          set((old) =>
            old.imageTopic !== imageTopic
              ? {
                  annotationsByTopic: new Map(),
                  tree: new AVLTree(compareTime),
                }
              : old,
          );
        },
        setAnnotationTopics(annotationTopics) {
          set({
            annotationTopics,
            // FIXME - what if synchronize is enabled?
          });
        },
        setSynchronize(synchronize) {
          set({
            synchronize,
            // FIXME - how to switch modes?
          });
        },
        clear() {
          set({
            annotationsByTopic: new Map(),
            tree: new AVLTree(compareTime),
          });
        },
        setCurrentFrame(currentFrame) {
          set((old) => addMessages(old, currentFrame));
        },
      },
    })),
  );

  return useStore(store, selectPublicState);
}
