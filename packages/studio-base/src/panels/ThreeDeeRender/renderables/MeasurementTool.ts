// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
import * as THREE from "three";

import { Renderer } from "../Renderer";
import { SceneExtension } from "../SceneExtension";

export class MeasurementTool extends SceneExtension {
  orbGeo = new THREE.SphereGeometry();
  orb = new THREE.Mesh(this.orbGeo, new THREE.MeshStandardMaterial());

  constructor(renderer: Renderer) {
    super("foxglove.MeasurementTool", renderer);

    this.add(this.orb);

    this.renderer.input.on("mousemove", this._handleMouseMove);
  }

  private _handleMouseMove = (
    cursorCoords: THREE.Vector2,
    worldSpaceCursorCoords: THREE.Vector3 | undefined,
    event: MouseEvent,
  ) => {
    if (worldSpaceCursorCoords) {
      this.orb.visible = true;
      this.orb.position.copy(worldSpaceCursorCoords);
      this.orb.position.z = 0;
      void event;
    } else {
      this.orb.visible = false;
    }
    this.renderer.queueAnimationFrame();
  };
}
