// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as THREE from "three";

import { toNanoSec } from "@foxglove/rostime";
import { SceneEntity, TriangleListPrimitive } from "@foxglove/schemas/schemas/typescript";
import {
  DynamicBufferGeometry,
  DynamicFloatBufferGeometry,
} from "@foxglove/studio-base/panels/ThreeDeeRender/DynamicBufferGeometry";
import { emptyPose } from "@foxglove/studio-base/util/Pose";

import type { Renderer } from "../../Renderer";
import { makeRgba, rgbToThreeColor, SRGBToLinear, stringToRgba } from "../../color";
import { LayerSettingsEntity } from "../SceneEntities";
import { RenderablePrimitive } from "./RenderablePrimitive";

const tempRgba = makeRgba();

type TriangleMesh = THREE.Mesh<DynamicFloatBufferGeometry, THREE.MeshStandardMaterial>;
export class RenderableTriangles extends RenderablePrimitive {
  private _triangleMeshes: TriangleMesh[] = [];
  public constructor(renderer: Renderer) {
    super("", renderer, {
      receiveTime: -1n,
      messageTime: -1n,
      frameId: "",
      pose: emptyPose(),
      settings: { visible: true, color: undefined },
      settingsPath: [],
      entity: undefined,
    });
  }

  private _ensureCapacity(triCount: number) {
    while (triCount > this._triangleMeshes.length) {
      this._triangleMeshes.push(makeTriangleMesh());
    }
  }
  private _updateTriangleMeshes(tris: TriangleListPrimitive[]) {
    this._ensureCapacity(tris.length);
    // removes all children so that meshes that are still in the _triangleMesh array
    // but don't have a new corresponding primitive  won't be rendered
    this.clear();

    let triMeshIdx = 0;
    for (const primitive of tris) {
      const mesh = this._triangleMeshes[triMeshIdx];
      if (!mesh) {
        continue;
      }
      const { geometry, material } = mesh;
      let transparent = false;

      let vertChanged = false;
      let colorChanged = false;

      geometry.resize(primitive.points.length);

      if (!geometry.attributes.position) {
        geometry.createAttribute("position", 3);
      }
      const vertices = geometry.attributes.position!;

      const singleColor = this.userData.settings.color
        ? stringToRgba(tempRgba, this.userData.settings.color)
        : primitive.colors.length === 0
        ? primitive.color
        : undefined;

      if (!singleColor && !geometry.attributes.color) {
        geometry.createAttribute("color", 4);
      }
      const colors = geometry.attributes.color;

      for (let i = 0; i < primitive.points.length; i++) {
        const point = primitive.points[i]!;
        vertChanged =
          vertChanged ||
          vertices.getX(i) !== point.x ||
          vertices.getY(i) !== point.y ||
          vertices.getZ(i) !== point.z;
        vertices.setX(i, point.x);
        vertices.setY(i, point.y);
        vertices.setZ(i, point.z);

        if (!singleColor && colors && primitive.colors.length > 0) {
          const color = primitive.colors[i]!;
          const r = SRGBToLinear(color.r);
          const g = SRGBToLinear(color.g);
          const b = SRGBToLinear(color.b);
          const a = SRGBToLinear(color.a);
          colorChanged =
            colorChanged ||
            colors.getX(i) !== r ||
            colors.getY(i) !== g ||
            colors.getZ(i) !== b ||
            colors.getW(i) !== a;
          colors.setX(i, r);
          colors.setY(i, g);
          colors.setZ(i, b);
          colors.setW(i, a);
          if (!transparent && a < 1.0) {
            transparent = true;
          }
        }
      }
      if (vertChanged) {
        geometry.computeVertexNormals();
        geometry.computeBoundingSphere();
        geometry.attributes.position!.needsUpdate = true;
      }

      if (colorChanged) {
        material.vertexColors = true;
        // can assume that color exists since colorchanged is true
        geometry.attributes.color!.needsUpdate = true;
        if (transparent) {
          material.transparent = transparent;
          material.depthWrite = !transparent;
        } else {
          material.transparent = transparent;
          material.depthWrite = !transparent;
        }
      } else if (singleColor) {
        material.vertexColors = false;
        material.transparent = singleColor.a < 1.0;
        material.depthWrite = singleColor.a >= 1.0;
        material.color = rgbToThreeColor(new THREE.Color(), singleColor);
        mesh.material.opacity = singleColor.a;
      }

      if (primitive.indices.length > 0) {
        geometry.setIndex(primitive.indices);
        // this is set in `geometry.resize` to itemCount
        // which works for non-indexed geometries but not for indexed geoms
        geometry.setDrawRange(0, primitive.indices.length);
      }

      mesh.position.set(
        primitive.pose.position.x,
        primitive.pose.position.y,
        primitive.pose.position.z,
      );
      mesh.quaternion.set(
        primitive.pose.orientation.x,
        primitive.pose.orientation.y,
        primitive.pose.orientation.z,
        primitive.pose.orientation.w,
      );
      this.add(mesh);
      triMeshIdx++;
    }
  }

  public override dispose(): void {
    for (const mesh of this._triangleMeshes) {
      mesh.geometry.dispose();
      mesh.material.dispose();
    }
    this.clear();
    this._triangleMeshes.length = 0;
  }

  public override update(
    entity: SceneEntity | undefined,
    settings: LayerSettingsEntity,
    receiveTime: bigint,
  ): void {
    this.userData.entity = entity;
    this.userData.settings = settings;
    this.userData.receiveTime = receiveTime;
    if (entity) {
      const lifetimeNs = toNanoSec(entity.lifetime);
      this.userData.expiresAt = lifetimeNs === 0n ? undefined : receiveTime + lifetimeNs;
      this._updateTriangleMeshes(entity.triangles);
    }
  }

  public updateSettings(settings: LayerSettingsEntity): void {
    this.update(this.userData.entity, settings, this.userData.receiveTime);
  }
}

function makeTriangleMesh(): TriangleMesh {
  return new THREE.Mesh(
    new DynamicBufferGeometry(Float32Array),
    new THREE.MeshStandardMaterial({
      metalness: 0,
      roughness: 1,
      flatShading: true,
      side: THREE.DoubleSide,
    }),
  );
}
