// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { emptyPose } from "@foxglove/studio-base/util/Pose";

import type { Renderer } from "../../Renderer";
import { RenderableCubes } from "./RenderableCubes";
import { PrimitiveType, RenderablePrimitive } from "./types";

const CONSTRUCTORS = {
  [PrimitiveType.CUBES]: RenderableCubes,
};

/**
 * An object pool for RenderableMarker subclass objects.
 */
export class PrimitivePool {
  private primitivesByType = new Map<PrimitiveType, RenderablePrimitive[]>();
  private disposed = false;

  constructor(private renderer: Renderer) {}

  acquire<T extends PrimitiveType>(
    type: T,
    // topic: string,
    // marker: Marker,
    // receiveTime: bigint | undefined,
  ): InstanceType<typeof CONSTRUCTORS[T]> {
    const primitives = this.primitivesByType.get(type);
    if (primitives) {
      const primitive = primitives.pop();
      if (primitive) {
        //FIXME: how are these used?
        // primitive.userData.settingsPath = ["topics", topic];
        // primitive.userData.settings = { visible: true, frameLocked: marker.frame_locked };
        // primitive.userData.topic = topic;
        // primitive.update(marker, receiveTime);
        primitive.userData.pose = emptyPose();
        return primitive as InstanceType<typeof CONSTRUCTORS[T]>;
      }
    }
    const primitive = new CONSTRUCTORS[type](this.renderer);
    primitive.userData.pose = emptyPose();
    return primitive as InstanceType<typeof CONSTRUCTORS[T]>;
  }

  release<T extends PrimitiveType>(type: T, primitive: InstanceType<typeof CONSTRUCTORS[T]>): void {
    if (this.disposed) {
      primitive.dispose();
      return;
    }
    const primitives = this.primitivesByType.get(type);
    if (!primitives) {
      this.primitivesByType.set(type, [primitive]);
    } else {
      primitives.push(primitive);
    }
  }

  dispose(): void {
    for (const primitives of this.primitivesByType.values()) {
      for (const primitive of primitives) {
        primitive.dispose();
      }
    }
    this.primitivesByType.clear();
    this.disposed = true;
  }
}
