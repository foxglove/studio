// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as THREE from "three";

import { PinholeCameraModel } from "@foxglove/den/image";
import { PointsAnnotation as NormalizedPointsAnnotation } from "@foxglove/studio-base/panels/Image/types";
import { SRGBToLinear } from "@foxglove/studio-base/panels/ThreeDeeRender/color";

import { DynamicBufferGeometry } from "../../../DynamicBufferGeometry";

const tempVec3 = new THREE.Vector3();

export class PointsRenderable extends THREE.Object3D {
  #geometry: DynamicBufferGeometry;
  #points: THREE.Points;
  #pointsMaterial: THREE.PointsMaterial;

  public constructor() {
    super();
    this.#geometry = new DynamicBufferGeometry();
    this.#geometry.createAttribute("position", Float32Array, 3);
    this.#geometry.createAttribute("color", Uint8Array, 4, true);
    this.#pointsMaterial = new THREE.PointsMaterial({
      size: 1,
      sizeAttenuation: false,
      vertexColors: true,
    });
    this.#points = new THREE.Points(this.#geometry, this.#pointsMaterial);
    this.add(this.#points);
  }

  public dispose(): void {
    this.#geometry.dispose();
    this.#pointsMaterial.dispose();
  }

  public update(
    annotation: NormalizedPointsAnnotation & { style: "points" },
    cameraModel: PinholeCameraModel,
    scale: number,
  ): void {
    const { points, outlineColors, outlineColor, fillColor, thickness } = annotation;
    this.#geometry.resize(points.length);
    const positionAttribute = this.#geometry.getAttribute("position") as THREE.BufferAttribute;
    const colorAttribute = this.#geometry.getAttribute("color") as THREE.BufferAttribute;
    const positions = positionAttribute.array as Float32Array;
    const colors = colorAttribute.array as Uint8Array;
    const fallbackColor = outlineColor && outlineColor.a > 0 ? outlineColor : fillColor;

    this.#pointsMaterial.size = thickness * scale;
    for (let i = 0; i < points.length; i++) {
      const color = outlineColors[i] ?? fallbackColor;
      const point = points[i]!;
      if (cameraModel.projectPixelTo3dPlane(tempVec3, point)) {
        positions[i * 3 + 0] = tempVec3.x;
        positions[i * 3 + 1] = tempVec3.y;
        positions[i * 3 + 2] = tempVec3.z;
        colors[i * 4 + 0] = SRGBToLinear(color?.r ?? 0) * 255;
        colors[i * 4 + 1] = SRGBToLinear(color?.g ?? 0) * 255;
        colors[i * 4 + 2] = SRGBToLinear(color?.b ?? 0) * 255;
        colors[i * 4 + 3] = (color?.a ?? 0) * 255;
      } else {
        positions[i * 3 + 0] = NaN;
        positions[i * 3 + 1] = NaN;
        positions[i * 3 + 2] = NaN;
      }
    }
    positionAttribute.needsUpdate = true;
    colorAttribute.needsUpdate = true;
  }
}
