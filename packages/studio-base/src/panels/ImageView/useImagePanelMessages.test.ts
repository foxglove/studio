// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { AVLTree } from "@foxglove/avl";
import { Time, compare as compareTime } from "@foxglove/rostime";

import { NormalizedImageMessage } from "./normalizeMessage";
import { Annotation } from "./types";
import { synchronizedAddMessage, ImagePanelMessages } from "./useImagePanelMessages";

function EmptyState() {
  return {
    tree: new AVLTree<Time, ImagePanelMessages>(compareTime),
  };
}

function GenerateImage(stamp: Time): NormalizedImageMessage {
  return {
    type: "compressed",
    stamp,
    format: "format",
    data: new Uint8Array(0),
  };
}

function GenerateAnnotations(stamp: Time): Annotation[] {
  return [
    {
      type: "circle",
      stamp,
      radius: 1,
      position: { x: 0, y: 0 },
      thickness: 1,
    },
  ];
}

describe("synchronizedAddMessage", () => {
  it("should return the same state when no images or annotations provided", () => {
    const state = EmptyState();
    const newState = synchronizedAddMessage(state);
    expect(newState).toEqual(state);
  });

  it("stores unsynchronized image message", () => {
    const state = EmptyState();

    const image = GenerateImage({ sec: 1, nsec: 0 });
    const newState = synchronizedAddMessage(state, image);

    // There's no synchronization, so we return the same state
    expect(newState).toEqual(state);

    expect(newState.tree.minKey()).toEqual({ sec: 1, nsec: 0 });
  });

  it("stores unsynchronized image message and unsynchronized annotations", () => {
    const state = EmptyState();

    const image = GenerateImage({ sec: 1, nsec: 0 });
    const annotations = GenerateAnnotations({ sec: 2, nsec: 0 });
    const newState = synchronizedAddMessage(state, image, annotations);

    // There's no synchronization, so we return the same state
    expect(newState).toEqual(state);

    expect(newState.tree.minKey()).toEqual({ sec: 1, nsec: 0 });
    expect(newState.tree.maxKey()).toEqual({ sec: 2, nsec: 0 });
  });

  it("produces results when getting synchronized messages and removes old messages", () => {
    const state = EmptyState();

    const image = GenerateImage({ sec: 1, nsec: 0 });
    const annotations = GenerateAnnotations({ sec: 2, nsec: 0 });

    {
      const newState = synchronizedAddMessage(state, image, annotations);
      expect(newState).toEqual(state);
    }

    const newImage = GenerateImage({ sec: 2, nsec: 0 });
    const newState = synchronizedAddMessage(state, newImage);

    expect(newState.image).toEqual(newImage);
    expect(newState.annotations).toEqual(annotations);

    expect(newState.tree.minKey()).toEqual({ sec: 2, nsec: 0 });
    expect(newState.tree.maxKey()).toEqual({ sec: 2, nsec: 0 });
  });
});
