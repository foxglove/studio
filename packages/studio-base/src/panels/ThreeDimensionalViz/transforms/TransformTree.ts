// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Time } from "@foxglove/rostime";

import { CoordinateFrame } from "./CoordinateFrame";
import { Transform } from "./Transform";

/**
 * TransformTree is a collection of coordinate frames with convenience methods
 * for getting and creating frames and adding transforms between frames.
 */
export class TransformTree {
  private _frames = new Map<string, CoordinateFrame>();

  addTransform(frameId: string, parentFrameId: string, time: Time, transform: Transform): void {
    const frame = this.getOrCreateFrame(frameId);
    const curParentFrame = frame.parent();
    if (curParentFrame == undefined) {
      // This frame was previously unparented but now we know its parent. Update it
      frame.setParent(this.getOrCreateFrame(parentFrameId));
    } else if (curParentFrame.id !== parentFrameId) {
      throw new Error(
        `Received "${frameId}"->"${parentFrameId}" transform but parent "${curParentFrame.id}" already exists`,
      );
    }

    frame.addTransform(time, transform);
  }

  hasFrame(id: string): boolean {
    return this._frames.has(id);
  }

  frame(id: string): CoordinateFrame | undefined {
    return this._frames.get(id);
  }

  getOrCreateFrame(id: string): CoordinateFrame {
    let frame = this._frames.get(id);
    if (!frame) {
      frame = new CoordinateFrame(id, undefined);
      this._frames.set(id, frame);
    }
    return frame;
  }

  frames(): ReadonlyMap<string, CoordinateFrame> {
    return this._frames;
  }
}
