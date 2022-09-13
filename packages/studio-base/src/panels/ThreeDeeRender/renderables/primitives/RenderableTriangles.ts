// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as THREE from "three";

import { toNanoSec } from "@foxglove/rostime";
import { SceneEntity, TriangleListPrimitive } from "@foxglove/schemas/schemas/typescript";
import { emptyPose } from "@foxglove/studio-base/util/Pose";

import type { Renderer } from "../../Renderer";
import { makeRgba, rgbToThreeColor, SRGBToLinear, stringToRgba } from "../../color";
import { LayerSettingsEntity } from "../SceneEntities";
import { RenderablePrimitive } from "./RenderablePrimitive";

const tempRgba = makeRgba();

type TriangleMesh = THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
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
    if (triCount > this._triangleMeshes.length) {
      for (let i = this._triangleMeshes.length - 1; i < triCount; i++) {
        this._triangleMeshes.push(makeTriangleMesh());
      }
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
      let dataChanged = false;
      let vertices = geometry.attributes.position;
      if (!vertices || vertices.count < primitive.points.length) {
        vertices = new THREE.BufferAttribute(new Float32Array(primitive.points.length * 3), 3);
      }
      const singleColor = this.userData.settings.color
        ? stringToRgba(tempRgba, this.userData.settings.color)
        : primitive.colors.length === 0
        ? primitive.color
        : undefined;

      let colors = geometry.attributes.color;
      if (!singleColor && (!colors || colors.count < primitive.points.length)) {
        colors = new THREE.BufferAttribute(new Float32Array(primitive.points.length * 4), 4);
      }
      for (let i = 0; i < primitive.points.length; i++) {
        const point = primitive.points[i]!;
        dataChanged =
          dataChanged ||
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
          dataChanged =
            dataChanged ||
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
      if (dataChanged) {
        geometry.setAttribute("position", vertices);
        if (colors) {
          geometry.setAttribute("color", colors);
          if (transparent) {
            material.transparent = transparent;
            material.depthWrite = !transparent;
            material.vertexColors = true;
          }
          geometry.attributes.color!.needsUpdate = true;
        }

        geometry.attributes.position!.needsUpdate = true;
        geometry.computeVertexNormals();
        geometry.computeBoundingSphere();
      }
      geometry.setIndex(primitive.indices);

      if (singleColor) {
        material.vertexColors = false;
        material.transparent = singleColor.a < 1.0;
        material.depthWrite = singleColor.a >= 1.0;
        material.color = rgbToThreeColor(new THREE.Color(), singleColor);
        mesh.material.opacity = singleColor.a;
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
    new THREE.BufferGeometry(),
    new THREE.MeshStandardMaterial({
      metalness: 0,
      roughness: 1,
      flatShading: true,
      side: THREE.DoubleSide,
    }),
  );
}
