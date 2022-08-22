// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { SceneEntity } from "@foxglove/schemas/schemas/typescript";
import { BaseUserData, Renderable } from "@foxglove/studio-base/panels/ThreeDeeRender/Renderable";
import { emptyPose } from "@foxglove/studio-base/util/Pose";

export type EntityRenderableUserData = BaseUserData & { entity?: SceneEntity };

export class RenderablePrimitive extends Renderable<EntityRenderableUserData> {
  public prepareForReuse(): void {
    this.userData.entity = undefined;
    this.userData.pose = emptyPose();
  }
}
