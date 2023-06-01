// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { areEqual } from "@foxglove/rostime";
import { PartialMessageEvent } from "@foxglove/studio-base/panels/ThreeDeeRender/SceneExtension";

import { AnyImage, CompressedImageTypes } from "./ImageTypes";
import { decodeCompressedImageToBitmap } from "./decodeImage";

export class BitmapCache {
  #latestBitmapsByTopic = new Map<
    string,
    { messageEvent: PartialMessageEvent<AnyImage>; bitmap: Promise<ImageBitmap> }
  >();

  public async getBitmap(
    messageEvent: PartialMessageEvent<AnyImage>,
    image: CompressedImageTypes,
    resizeWidth?: number,
  ): Promise<ImageBitmap> {
    const cachedBitmap = this.#latestBitmapsByTopic.get(messageEvent.topic);
    if (cachedBitmap && areEqual(cachedBitmap.messageEvent.receiveTime, messageEvent.receiveTime)) {
      return await cachedBitmap.bitmap;
    }
    const newBitmap = {
      messageEvent,
      bitmap: decodeCompressedImageToBitmap(image, resizeWidth),
    };
    this.#latestBitmapsByTopic.set(messageEvent.topic, newBitmap);
    return await newBitmap.bitmap;
  }
}
