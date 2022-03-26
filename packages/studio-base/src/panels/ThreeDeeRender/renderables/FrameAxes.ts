// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as THREE from "three";

import Logger from "@foxglove/log";
import {
  MaterialCache,
  StandardColor,
} from "@foxglove/studio-base/panels/ThreeDeeRender/MaterialCache";

import { Renderer } from "../Renderer";
import { arrowHeadSubdivisions, arrowShaftSubdivisions, DetailLevel } from "../lod";
import { Pose, rosTimeToNanoSec, TF } from "../ros";
import { Transform } from "../transforms/Transform";
import { makePose } from "../transforms/geometry";
import { updatePose } from "../updatePose";
import { missingTransformMessage, MISSING_TRANSFORM } from "./transforms";

const log = Logger.getLogger(__filename);

const SHAFT_LENGTH = 0.154;
const SHAFT_DIAMETER = 0.02;
const HEAD_LENGTH = 0.046;
const HEAD_DIAMETER = 0.05;

const tempMat4 = new THREE.Matrix4();
const tempVec = new THREE.Vector3();
const tempColor = new THREE.Color();

type FrameAxisRenderable = THREE.Object3D & {
  userData: {
    frameId: string;
    pose: Pose;
    shaftMesh: THREE.InstancedMesh;
    headMesh: THREE.InstancedMesh;
  };
};

export class FrameAxes extends THREE.Object3D {
  private static shaftLod: DetailLevel | undefined;
  private static headLod: DetailLevel | undefined;
  private static shaftGeometry: THREE.CylinderGeometry | undefined;
  private static headGeometry: THREE.ConeGeometry | undefined;

  renderer: Renderer;
  axesByFrameId = new Map<string, FrameAxisRenderable>();

  constructor(renderer: Renderer) {
    super();
    this.renderer = renderer;
  }

  dispose(): void {
    for (const renderable of this.axesByFrameId.values()) {
      releaseStandardMaterial(this.renderer.materialCache);
      renderable.userData.shaftMesh.dispose();
      renderable.userData.headMesh.dispose();
    }
    this.children.length = 0;
    this.axesByFrameId.clear();
  }

  addTransformMessage(tf: TF): void {
    let frameAdded = false;
    if (!this.renderer.transformTree.hasFrame(tf.header.frame_id)) {
      this._addFrameAxis(tf.header.frame_id);
      frameAdded = true;
    }
    if (!this.renderer.transformTree.hasFrame(tf.child_frame_id)) {
      this._addFrameAxis(tf.child_frame_id);
      frameAdded = true;
    }

    // Create a new transform and add it to the renderer's TransformTree
    const stamp = rosTimeToNanoSec(tf.header.stamp);
    const t = tf.transform.translation;
    const q = tf.transform.rotation;
    const transform = new Transform([t.x, t.y, t.z], [q.x, q.y, q.z, q.w]);
    this.renderer.transformTree.addTransform(
      tf.child_frame_id,
      tf.header.frame_id,
      stamp,
      transform,
    );

    if (frameAdded) {
      log.debug(`Added transform "${tf.header.frame_id}_T_${tf.child_frame_id}"`);
      this.renderer.emit("transformTreeUpdated", this.renderer);
    }
  }

  startFrame(currentTime: bigint): void {
    const renderFrameId = this.renderer.renderFrameId;
    const fixedFrameId = this.renderer.fixedFrameId;
    if (!renderFrameId || !fixedFrameId) {
      return;
    }

    for (const [frameId, renderable] of this.axesByFrameId.entries()) {
      const updated = updatePose(
        renderable,
        this.renderer.transformTree,
        renderFrameId,
        fixedFrameId,
        frameId,
        currentTime,
        currentTime,
      );
      if (!updated) {
        const message = missingTransformMessage(renderFrameId, fixedFrameId, frameId);
        this.renderer.layerErrors.addToLayer(`f:${frameId}`, MISSING_TRANSFORM, message);
      }
    }
  }

  private _addFrameAxis(frameId: string): void {
    if (this.axesByFrameId.has(frameId)) {
      return;
    }

    const renderable = new THREE.Object3D() as FrameAxisRenderable;
    renderable.name = frameId;
    renderable.userData.frameId = frameId;
    renderable.userData.pose = makePose();

    const material = standardMaterial(this.renderer.materialCache);
    const shaftInstances = new THREE.InstancedMesh(
      FrameAxes.ShaftGeometry(this.renderer.lod),
      material,
      3,
    );
    shaftInstances.castShadow = true;
    shaftInstances.receiveShadow = true;
    renderable.add(shaftInstances);
    // Set x, y, and z axis arrow directions
    tempVec.set(SHAFT_LENGTH, SHAFT_DIAMETER, SHAFT_DIAMETER);
    shaftInstances.setMatrixAt(0, tempMat4.identity().scale(tempVec));
    shaftInstances.setMatrixAt(1, tempMat4.makeRotationZ(Math.PI / 2).scale(tempVec));
    shaftInstances.setMatrixAt(2, tempMat4.makeRotationY(-Math.PI / 2).scale(tempVec));
    shaftInstances.setColorAt(0, tempColor.setHex(0x9c3948).convertSRGBToLinear());
    shaftInstances.setColorAt(1, tempColor.setHex(0x88dd04).convertSRGBToLinear());
    shaftInstances.setColorAt(2, tempColor.setHex(0x2b90fb).convertSRGBToLinear());

    const headInstances = new THREE.InstancedMesh(
      FrameAxes.HeadGeometry(this.renderer.lod),
      material,
      3,
    );
    headInstances.castShadow = true;
    headInstances.receiveShadow = true;
    renderable.add(headInstances);
    // Set x, y, and z axis arrow directions
    tempVec.set(HEAD_LENGTH, HEAD_DIAMETER, HEAD_DIAMETER);
    headInstances.setMatrixAt(
      0,
      tempMat4.identity().scale(tempVec).setPosition(SHAFT_LENGTH, 0, 0),
    );
    headInstances.setMatrixAt(
      1,
      tempMat4
        .makeRotationZ(Math.PI / 2)
        .scale(tempVec)
        .setPosition(0, SHAFT_LENGTH, 0),
    );
    headInstances.setMatrixAt(
      2,
      tempMat4
        .makeRotationY(-Math.PI / 2)
        .scale(tempVec)
        .setPosition(0, 0, SHAFT_LENGTH),
    );
    headInstances.setColorAt(0, tempColor.setHex(0x9c3948).convertSRGBToLinear());
    headInstances.setColorAt(1, tempColor.setHex(0x88dd04).convertSRGBToLinear());
    headInstances.setColorAt(2, tempColor.setHex(0x2b90fb).convertSRGBToLinear());

    renderable.userData.shaftMesh = shaftInstances;
    renderable.userData.headMesh = headInstances;

    // this.shaftMesh.scale.set(SHAFT_LENGTH, SHAFT_DIAMETER, SHAFT_DIAMETER);
    // this.headMesh.scale.set(HEAD_LENGTH, HEAD_DIAMETER, HEAD_DIAMETER);
    // this.scale.set(marker.scale.x, marker.scale.y, marker.scale.z);

    // const halfShaftLength = SHAFT_LENGTH / 2;
    // const halfHeadLength = HEAD_LENGTH / 2;
    // this.shaftMesh.position.set(halfShaftLength, 0, 0);
    // this.headMesh.position.set(halfShaftLength * 2 + halfHeadLength, 0, 0);

    // const AXIS_DEFAULT_LENGTH = 1; // [m]
    // const axes = new THREE.AxesHelper(AXIS_DEFAULT_LENGTH);
    // renderable.add(axes);

    // TODO: <div> floating label

    this.add(renderable);
    this.axesByFrameId.set(frameId, renderable);
  }

  static ShaftGeometry(lod: DetailLevel): THREE.CylinderGeometry {
    if (!FrameAxes.shaftGeometry || lod !== FrameAxes.shaftLod) {
      const subdivs = arrowShaftSubdivisions(lod);
      FrameAxes.shaftGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1, subdivs, 1, false);
      FrameAxes.shaftGeometry.rotateZ(-Math.PI / 2);
      FrameAxes.shaftGeometry.translate(0.5, 0, 0);
      FrameAxes.shaftGeometry.computeBoundingSphere();
      FrameAxes.shaftLod = lod;
    }
    return FrameAxes.shaftGeometry;
  }

  static HeadGeometry(lod: DetailLevel): THREE.ConeGeometry {
    if (!FrameAxes.headGeometry || lod !== FrameAxes.headLod) {
      const subdivs = arrowHeadSubdivisions(lod);
      FrameAxes.headGeometry = new THREE.ConeGeometry(0.5, 1, subdivs, 1, false);
      FrameAxes.headGeometry.rotateZ(-Math.PI / 2);
      FrameAxes.headGeometry.translate(0.5, 0, 0);
      FrameAxes.headGeometry.computeBoundingSphere();
      FrameAxes.headLod = lod;
    }
    return FrameAxes.headGeometry;
  }
}

const COLOR_WHITE = { r: 1, g: 1, b: 1, a: 1 };

function standardMaterial(materialCache: MaterialCache): THREE.MeshStandardMaterial {
  return materialCache.acquire(
    StandardColor.id(COLOR_WHITE),
    () => StandardColor.create(COLOR_WHITE),
    StandardColor.dispose,
  );
}

function releaseStandardMaterial(materialCache: MaterialCache): void {
  materialCache.release(StandardColor.id(COLOR_WHITE));
}
