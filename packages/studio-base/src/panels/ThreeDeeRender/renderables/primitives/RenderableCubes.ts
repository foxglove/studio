// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as THREE from "three";

import { toNanoSec } from "@foxglove/rostime";
import { CubePrimitive, SceneEntity } from "@foxglove/schemas/schemas/typescript";

import type { Renderer } from "../../Renderer";
import { rgbToThreeColor } from "../../color";
import { MeshStandardMaterialWithInstanceOpacity } from "./MeshStandardMaterialWithInstanceOpacity";

const tempColor = new THREE.Color();
const tempVec3 = new THREE.Vector3();
const tempVec3_2 = new THREE.Vector3();
const tempMat4 = new THREE.Matrix4();
const tempQuat = new THREE.Quaternion();

export class RenderableCubes extends THREE.Object3D {
  private static cubeGeometry: THREE.BoxGeometry | undefined;
  private static cubeEdgesGeometry: THREE.EdgesGeometry | undefined;

  // Each RenderableCubes needs its own geometry because we attach additional custom attributes to it.
  geometry = new THREE.BoxGeometry(1, 1, 1);
  mesh: THREE.InstancedMesh<THREE.BoxGeometry, MeshStandardMaterialWithInstanceOpacity>;
  instanceOpacity: THREE.InstancedBufferAttribute;
  // FIXME: could be shared with all other renderable primitives?
  material = new MeshStandardMaterialWithInstanceOpacity({
    metalness: 0,
    roughness: 1,
    dithering: true,
  });

  /**
   * The initial count passed to `mesh`'s constructor, i.e. the maximum number of instances it can
   * render before we need to create a new mesh object
   */
  maxInstances: number;

  outlineGeometry: THREE.InstancedBufferGeometry;
  outline: THREE.LineSegments;

  renderer: Renderer;

  constructor(topic: string, renderer: Renderer) {
    super();
    this.renderer = renderer;

    // Cube mesh
    this.maxInstances = 16;
    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, this.maxInstances);
    this.instanceOpacity = new THREE.InstancedBufferAttribute(
      new Float32Array(this.maxInstances),
      1,
    );
    this.geometry.setAttribute("instanceOpacity", this.instanceOpacity);
    this.mesh.count = 0;
    this.add(this.mesh);

    // Cube outline
    this.outlineGeometry = new THREE.InstancedBufferGeometry().copy(
      RenderableCubes.EdgesGeometry(),
    );
    this.outlineGeometry.setAttribute("instanceMatrix", this.mesh.instanceMatrix);
    this.outline = new THREE.LineSegments(this.outlineGeometry, renderer.instancedOutlineMaterial);
    this.outline.frustumCulled = false;
    this.outline.userData.picking = false;
    this.add(this.outline);
  }

  private _ensureCapacity(numCubes: number) {
    if (numCubes > this.maxInstances) {
      const newCapacity = Math.trunc(numCubes * 1.5) + 16;
      this.maxInstances = newCapacity;

      this.mesh.removeFromParent();
      this.mesh.dispose();
      this.mesh = new THREE.InstancedMesh(this.mesh.geometry, this.material, this.maxInstances);
      this.instanceOpacity = new THREE.InstancedBufferAttribute(
        new Float32Array(this.maxInstances),
        1,
      );
      this.geometry.setAttribute("instanceOpacity", this.instanceOpacity);
      this.add(this.mesh);

      // THREE.js doesn't correctly recompute the new max instance count when dynamically
      // reassigning the attribute of InstancedBufferGeometry, so we just create a new geometry
      this.outlineGeometry.dispose();
      this.outlineGeometry = new THREE.InstancedBufferGeometry().copy(
        RenderableCubes.EdgesGeometry(),
      );
      this.outlineGeometry.instanceCount = newCapacity;
      this.outlineGeometry.setAttribute("instanceMatrix", this.mesh.instanceMatrix);
      this.outline.geometry = this.outlineGeometry;
    }
  }

  private _updateMesh(cubes: CubePrimitive[]) {
    let isTransparent = false;

    this._ensureCapacity(cubes.length);

    let i = 0;
    for (const cube of cubes) {
      if (cube.color.a < 1) {
        isTransparent = true;
      }
      this.mesh.setColorAt(i, rgbToThreeColor(tempColor, cube.color));
      this.instanceOpacity.setX(i, cube.color.a);
      this.mesh.setMatrixAt(
        i,
        tempMat4.compose(
          tempVec3.set(cube.pose.position.x, cube.pose.position.y, cube.pose.position.z),
          tempQuat.set(
            cube.pose.orientation.x,
            cube.pose.orientation.y,
            cube.pose.orientation.z,
            cube.pose.orientation.w,
          ),
          tempVec3_2.set(cube.size.x, cube.size.y, cube.size.z),
        ),
      );
      i++;
    }

    this.mesh.material.transparent = isTransparent;
    this.mesh.material.depthWrite = !isTransparent;

    if (this.mesh.count === 0 && cubes.length > 0) {
      // needed to make colors work: https://discourse.threejs.org/t/instancedmesh-color-doesnt-work-when-initial-count-is-0/41355
      this.mesh.material.needsUpdate = true;
    }
    this.mesh.count = cubes.length;
    this.outlineGeometry.instanceCount = cubes.length;
    this.mesh.instanceMatrix.needsUpdate = true;
    this.instanceOpacity.needsUpdate = true;

    // may be null if we were initialized with count 0 and still have 0 cubes
    if (this.mesh.instanceColor) {
      this.mesh.instanceColor.needsUpdate = true;
    }
  }

  dispose(): void {
    this.mesh.dispose();
    this.geometry.dispose();
    this.material.dispose();
    this.outlineGeometry.dispose();
  }

  update(entity: SceneEntity, _receiveTime: bigint | undefined): void {
    //FIXME: put in superclass? do these even need to be in userData?
    this.userData.messageTime = toNanoSec(entity.timestamp);
    this.userData.frameId = this.renderer.normalizeFrameId(entity.frame_id);
    this.userData.entity = entity;

    this._updateMesh(entity.cubes);
  }

  static Geometry(): THREE.BoxGeometry {
    if (!RenderableCubes.cubeGeometry) {
      RenderableCubes.cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
      RenderableCubes.cubeGeometry.computeBoundingSphere();
    }
    return RenderableCubes.cubeGeometry;
  }

  static EdgesGeometry(): THREE.EdgesGeometry {
    if (!RenderableCubes.cubeEdgesGeometry) {
      RenderableCubes.cubeEdgesGeometry = new THREE.EdgesGeometry(RenderableCubes.Geometry(), 40);
      RenderableCubes.cubeEdgesGeometry.computeBoundingSphere();
    }
    return RenderableCubes.cubeEdgesGeometry;
  }
}
