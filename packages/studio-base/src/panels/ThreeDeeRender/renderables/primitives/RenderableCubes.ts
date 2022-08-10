// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as THREE from "three";

import { toNanoSec } from "@foxglove/rostime";
import { CubePrimitive, SceneEntity } from "@foxglove/schemas/schemas/typescript";

import type { Renderer } from "../../Renderer";
// import { rgbToThreeColor } from "../../color";
// import { makeStandardMaterial } from "./materials";

const tempColor = new THREE.Color();
const tempVec3 = new THREE.Vector3();
const tempVec3_2 = new THREE.Vector3();
const tempMat4 = new THREE.Matrix4();
const tempQuat = new THREE.Quaternion();
export class RenderableCubes extends THREE.Object3D {
  private static cubeGeometry: THREE.BoxGeometry | undefined;
  private static cubeEdgesGeometry: THREE.EdgesGeometry | undefined;

  material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    metalness: 0,
    roughness: 1,
    dithering: true,
  });
  geometry: THREE.InstancedBufferGeometry;
  mesh: THREE.InstancedMesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>;
  outline: THREE.LineSegments | undefined;

  renderer: Renderer;

  constructor(topic: string, renderer: Renderer) {
    super();
    this.renderer = renderer;

    // const numVertices=24;
    this.geometry = new THREE.InstancedBufferGeometry().copy(new THREE.BoxGeometry(1, 1, 1));

    // const instanceData = new Float32Array(numVertices * 4);
    // const buffer = new THREE.InstancedInterleavedBuffer();
    // const color = new THREE.InstancedBufferAttribute(instanceData, 4, undefined, 1);

    // this.geometry.setAttribute('color', color)
    // const nonInstanceBuffer = new THREE.InterleavedBuffer(attributeData, 8);
    // this.position = new THREE.InterleavedBufferAttribute(nonInstanceBuffer, 3, 0);
    // this.normal = new THREE.InterleavedBufferAttribute(nonInstanceBuffer, 3, 3);
    // this.geometry.setAttribute("position");
    // this.geometry.setAttribute("normal");
    // this.geometry.setAttribute("color");
    // Cube mesh
    this.mesh = new THREE.InstancedMesh(RenderableCubes.Geometry(), this.material, 0);
    this.add(this.mesh);

    // Cube outline
    this.outline = new THREE.LineSegments(
      RenderableCubes.EdgesGeometry(),
      renderer.outlineMaterial,
    );
    this.outline.userData.picking = false;
    this.mesh.add(this.outline);
  }

  private reallocateAttributeBufferIfNeeded(numCubes: number) {
    // const requiredLength = numCubes * 10 * Float32Array.BYTES_PER_ELEMENT;
    // if (this.instanceAttrData.byteLength < requiredLength) {
    //   this.instanceAttrData = new Float32Array(requiredLength);
    //   this.instanceAttrBuffer = new THREE.InstancedInterleavedBuffer(this.instanceAttrData, 10, 1);
    //   this.instanceBoxPosition.data = this.instanceAttrBuffer;
    //   this.instanceCharPosition.data = this.instanceAttrBuffer;
    //   this.instanceUv.data = this.instanceAttrBuffer;
    //   this.instanceBoxSize.data = this.instanceAttrBuffer;
    //   this.instanceCharSize.data = this.instanceAttrBuffer;
    // }
  }

  private _updateMesh(cubes: CubePrimitive[]) {
    let isTransparent = false;

    this.mesh.instanceMatrix = new THREE.InstancedBufferAttribute(
      new Float32Array(16 * cubes.length),
      16,
    );
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(
      new Float32Array(3 * cubes.length),
      3,
    );

    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);

    this.mesh.count = cubes.length;
    this.mesh.instanceMatrix.count = cubes.length;
    this.mesh.instanceColor.count = cubes.length;
    this.mesh.instanceMatrix.needsUpdate = true;
    this.mesh.instanceColor.needsUpdate = true;

    let i = 0;
    for (const cube of cubes) {
      if (cube.color.a < 1) {
        isTransparent = true;
      }
      this.mesh.setColorAt(
        i,
        tempColor.setRGB(cube.color.r, cube.color.g, cube.color.b).convertSRGBToLinear(),
      );
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
  }

  dispose(): void {
    this.material.dispose();
    this.geometry.dispose();
  }

  update(entity: SceneEntity, _receiveTime: bigint | undefined): void {
    //TODO: put in superclass? do these even need to be in userData?
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
