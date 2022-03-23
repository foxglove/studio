// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as THREE from "three";

import { DynamicBufferAttribute } from "../../DynamicBufferAttribute";
import type { Renderer } from "../../Renderer";
import { approxEquals } from "../../math";
import { Marker } from "../../ros";
import { RenderableMarker } from "./RenderableMarker";
import { markerHasTransparency, pointsMaterial, releasePointsMaterial } from "./materials";

export class RenderablePoints extends RenderableMarker {
  geometry: THREE.BufferGeometry;
  positionAttribute: DynamicBufferAttribute<Float32Array, Float32ArrayConstructor>;
  colorAttribute: DynamicBufferAttribute<Float32Array, Float32ArrayConstructor>;
  points: THREE.Points;

  constructor(topic: string, marker: Marker, renderer: Renderer) {
    super(topic, marker, renderer);

    this.geometry = new THREE.BufferGeometry();

    this.positionAttribute = new DynamicBufferAttribute(Float32Array, 3);
    this.colorAttribute = new DynamicBufferAttribute(Float32Array, 4);

    this.geometry.setAttribute("position", this.positionAttribute);
    this.geometry.setAttribute("color", this.colorAttribute);

    const material = pointsMaterial(marker, renderer.materialCache);
    this.points = new THREE.Points(this.geometry, material);
    this.add(this.points);

    this.update(marker);
  }

  override dispose(): void {
    releasePointsMaterial(this.userData.marker, this._renderer.materialCache);
  }

  override update(marker: Marker): void {
    const prevMarker = this.userData.marker;
    super.update(marker);

    const prevWidth = prevMarker.scale.x;
    const prevHeight = prevMarker.scale.y;
    const prevTransparent = markerHasTransparency(prevMarker);
    const width = marker.scale.x;
    const height = marker.scale.y;
    const transparent = markerHasTransparency(marker);

    if (
      !approxEquals(prevWidth, width) ||
      !approxEquals(prevHeight, height) ||
      prevTransparent !== transparent
    ) {
      releasePointsMaterial(prevMarker, this._renderer.materialCache);
      this.points.material = pointsMaterial(marker, this._renderer.materialCache);
    }

    this._setPositions(marker);
    this._setColors(marker);
  }

  private _setPositions(marker: Marker): void {
    this.positionAttribute.resize(marker.points.length);

    const positions = this.positionAttribute.data();
    for (let i = 0; i < marker.points.length; i++) {
      const point = marker.points[i]!;
      positions[i * 3 + 0] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;
    }
    this.positionAttribute.needsUpdate = true;
  }

  private _setColors(marker: Marker): void {
    // Converts color-per-point to a flattened typed array
    const length = marker.points.length;
    this.colorAttribute.resize(length);
    const rgbaData = this.colorAttribute.data();
    this._markerColorsToLinear(marker, (color, i) => {
      rgbaData[4 * i + 0] = color[0];
      rgbaData[4 * i + 1] = color[1];
      rgbaData[4 * i + 2] = color[2];
      rgbaData[4 * i + 3] = color[3];
    });
    this.colorAttribute.needsUpdate = true;
  }
}
