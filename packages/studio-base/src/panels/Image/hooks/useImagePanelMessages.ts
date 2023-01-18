// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useState } from "react";
import { createStore, useStore } from "zustand";

import { AVLTree } from "@foxglove/avl";
import {
  Time,
  compare as compareTime,
  isLessThan,
  toNanoSec,
  fromNanoSec,
} from "@foxglove/rostime";
import { MessageEvent, RenderState } from "@foxglove/studio";

import { normalizeAnnotations } from "../lib/normalizeAnnotations";
import { normalizeImageMessage } from "../lib/normalizeMessage";
import { Annotation, NormalizedImageMessage } from "../types";

type ImagePanelState = {
  imageTopic?: string;
  annotationTopics: string[];
  image?: NormalizedImageMessage;
  annotationsByTopic: Map<string, Annotation[]>;
  tree: AVLTree<Time, SynchronizationItem>;
  synchronize: boolean;

  actions: {
    frame(currentFrame: NonNullable<RenderState["currentFrame"]>): void;
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

export function synchronizedAddMessages(
  state: ImagePanelState,
  messageEvents: readonly MessageEvent<unknown>[],
): Partial<ImagePanelState> {
  for (const messageEvent of messageEvents) {
    const image = normalizeImageMessage(messageEvent, messageEvent.schemaName);
    const annotations = normalizeAnnotations(messageEvent, messageEvent.schemaName);
    if (!image && !annotations) {
      continue;
    }

    if (image) {
      // Update the image at the stamp time
      const item = state.tree.get(image.stamp);
      if (item) {
        item.image = image;
      } else {
        state.tree.set(image.stamp, {
          image,
          annotationsByTopic: new Map(),
        });
      }
    }

    if (annotations) {
      // Group annotations by timestamp, then update the annotations by topic at each stamp
      const groups = new Map<bigint, Annotation[]>();
      for (const annotation of annotations) {
        const key = toNanoSec(annotation.stamp);
        const arr = groups.get(key);
        if (arr) {
          arr.push(annotation);
        } else {
          groups.set(key, [annotation]);
        }
      }

      for (const [stampNsec, group] of groups) {
        const stamp = fromNanoSec(stampNsec);
        let item = state.tree.get(stamp);
        if (!item) {
          item = {
            image: undefined,
            annotationsByTopic: new Map(),
          };
          state.tree.set(stamp, item);
        }
        item.annotationsByTopic.set(messageEvent.topic, group);
      }
    }

    // Find the oldest entry where we have everything synchronized
    let validEntry: [Time, SynchronizationItem] | undefined = undefined;
    for (const entry of state.tree.entries()) {
      const messageState = entry[1];
      // If we have an image and all the messages for annotation topics then we have a synchronized set.
      if (
        messageState.image &&
        messageState.annotationsByTopic.size === state.annotationTopics.length
      ) {
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
        imageTopic: state.imageTopic,
        image: validEntry[1].image,
        annotationsByTopic: validEntry[1].annotationsByTopic,
        tree: state.tree,
      };
    }
  }

  // with no valid entry, we keep the previous state
  return state;
}

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

function useImagePanelMessages(initialState: {
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
        frame(currentFrame) {
          set((old) => addMessages(old, currentFrame));
        },
      },
    })),
  );

  return useStore(store, selectPublicState);
}

export { useImagePanelMessages };
