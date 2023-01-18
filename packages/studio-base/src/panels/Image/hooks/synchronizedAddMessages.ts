// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Time, isLessThan, toNanoSec, fromNanoSec } from "@foxglove/rostime";
import { MessageEvent } from "@foxglove/studio";

import { normalizeAnnotations } from "../lib/normalizeAnnotations";
import { normalizeImageMessage } from "../lib/normalizeMessage";
import { Annotation } from "../types";
import { ImagePanelState, SynchronizationItem } from "./useImagePanelMessages";

export function synchronizedAddMessages(
  state: Pick<ImagePanelState, "imageTopic" | "annotationTopics" | "tree">,
  messageEvents: readonly MessageEvent<unknown>[],
): Partial<ImagePanelState> {
  for (const messageEvent of messageEvents) {
    const image = normalizeImageMessage(messageEvent.message, messageEvent.schemaName);
    const annotations = normalizeAnnotations(messageEvent.message, messageEvent.schemaName);
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
