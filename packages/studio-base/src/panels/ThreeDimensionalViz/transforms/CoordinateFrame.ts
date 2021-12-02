// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

/* eslint-disable no-underscore-dangle */

import { mat4, quat, vec3 } from "gl-matrix";

import { AVLTree } from "@foxglove/avl";
import {
  Duration,
  Time,
  compare,
  subtract,
  areEqual,
  interpolate,
  percentOf,
  isLessThan,
} from "@foxglove/rostime";
import { MutablePose, Pose } from "@foxglove/studio-base/types/Messages";

import { Transform } from "./Transform";

type TimeAndTransform = [time: Time, transform: Transform];

const DEFAULT_MAX_STORAGE_TIME: Duration = { sec: 10, nsec: 0 };

const tempLower: TimeAndTransform = [
  { sec: 0, nsec: 0 },
  new Transform(vec3.create(), quat.create()),
];
const tempUpper: TimeAndTransform = [
  { sec: 0, nsec: 0 },
  new Transform(vec3.create(), quat.create()),
];
const tempTransform = new Transform(vec3.create(), quat.create());
const tempMatrix = mat4.create();

/**
 * CoordinateFrame is a named 3D coordinate frame with an optional parent frame
 * and a history of transforms from this frame to its parent. The parent/child
 * hierarchy and transform history allow points to be transformed from one
 * coordinate frame to another while interpolating over time.
 */
export class CoordinateFrame {
  readonly id: string;
  maxStorageTime: Duration;

  private _parent?: CoordinateFrame;
  private _transforms: AVLTree<Time, Transform> = new AVLTree<Time, Transform>(compare);

  constructor(
    id: string,
    parent: CoordinateFrame | undefined,
    maxStorageTime: Duration = DEFAULT_MAX_STORAGE_TIME,
  ) {
    this.id = id;
    this._parent = parent;
    this.maxStorageTime = maxStorageTime;
    if (parent) {
      this.setParent(parent);
    }
  }

  parent(): CoordinateFrame | undefined {
    return this._parent;
  }

  root(): CoordinateFrame {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let root: CoordinateFrame = this;
    while (root._parent) {
      root = root._parent;
    }
    return root;
  }

  hasParent(id: string): boolean {
    let parent: CoordinateFrame | undefined = this._parent;
    while (parent) {
      if (parent.id === id) {
        return true;
      }
      parent = parent._parent;
    }
    return false;
  }

  setParent(parent: CoordinateFrame): void {
    if (this._parent && this._parent !== parent) {
      throw new Error(
        `Cannot reparent frame "${this.id}" from "${this._parent.id}" to "${parent.id}"`,
      );
    }
    this._parent = parent;
  }

  findAncestor(id: string): CoordinateFrame | undefined {
    let ancestor: CoordinateFrame | undefined = this._parent;
    while (ancestor) {
      if (ancestor.id === id) {
        return ancestor;
      }
      ancestor = ancestor._parent;
    }
    return undefined;
  }

  addTransform(time: Time, transform: Transform): void {
    this._transforms.set(time, transform);

    // Remove transforms that are too old
    const endTime = this._transforms.maxKey()!;
    const startTime = subtract(endTime, this.maxStorageTime);
    while (this._transforms.size > 1 && isLessThan(this._transforms.minKey()!, startTime)) {
      this._transforms.shift();
    }
  }

  findClosestTransforms(
    outLower: TimeAndTransform,
    outUpper: TimeAndTransform,
    time: Time,
    maxDelta: Duration,
  ): boolean {
    if (this._transforms.size === 0) {
      return false;
    }

    // If only a single transform exists, check if it's within the maxDelta
    if (this._transforms.size === 1) {
      const [latestTime, latestTf] = this._transforms.maxEntry()!;
      if (isDiffWithinDelta(time, latestTime, maxDelta)) {
        outLower[0] = outUpper[0] = latestTime;
        outLower[1] = outUpper[1] = latestTf;
        return true;
      }
      return false;
    }

    const lte = this._transforms.findLessThanOrEqual(time);

    // If the time is before the first transform, check if the first transform is within maxDelta
    if (!lte) {
      const [firstTime, firstTf] = this._transforms.minEntry()!;
      if (isDiffWithinDelta(time, firstTime, maxDelta)) {
        outLower[0] = outUpper[0] = firstTime;
        outLower[1] = outUpper[1] = firstTf;
        return true;
      }
      return false;
    }

    const [lteTime, lteTf] = lte;

    // Check if an exact match was found
    if (areEqual(lteTime, time)) {
      outLower[0] = outUpper[0] = lteTime;
      outLower[1] = outUpper[1] = lteTf;
      return true;
    }

    const gt = this._transforms.findGreaterThan(time);

    // If the time is after the last transform, check if the last transform is within maxDelta
    if (!gt) {
      const [lastTime, lastTf] = this._transforms.maxEntry()!;
      if (isDiffWithinDelta(time, lastTime, maxDelta)) {
        outLower[0] = outUpper[0] = lastTime;
        outLower[1] = outUpper[1] = lastTf;
        return true;
      }
      return false;
    }

    // Return the transforms closest to the requested time
    const [gtTime, gtTf] = gt;
    outLower[0] = lteTime;
    outLower[1] = lteTf;
    outUpper[0] = gtTime;
    outUpper[1] = gtTf;
    return true;
  }

  apply(
    out: MutablePose,
    input: Pose,
    srcFrame: CoordinateFrame,
    time: Time,
    maxDelta: Duration = { sec: 1, nsec: 0 },
  ): boolean {
    if (srcFrame === this) {
      // Identity transform
      out.position = input.position;
      out.orientation = input.orientation;
      return true;
    } else if (srcFrame.hasParent(this.id)) {
      // This frame is a parent of the source frame
      return CoordinateFrame.Apply(out, input, this, srcFrame, false, time, maxDelta);
    } else if (this.hasParent(srcFrame.id)) {
      // This frame is a child of the source frame
      return CoordinateFrame.Apply(out, input, srcFrame, this, true, time, maxDelta);
    }

    // Check if the two frames share a common parent
    let curSrcFrame: CoordinateFrame | undefined = srcFrame;
    while (curSrcFrame) {
      const commonParent = this.findAncestor(curSrcFrame.id);
      if (commonParent) {
        // Common parent found. Apply transforms from the source frame to the common parent,
        // then apply transforms from the common parent to this frame
        if (!CoordinateFrame.Apply(out, input, commonParent, srcFrame, false, time, maxDelta)) {
          return false;
        }
        return CoordinateFrame.Apply(out, out, commonParent, this, true, time, maxDelta);
      }
      curSrcFrame = curSrcFrame._parent;
    }

    return false;
  }

  static Interpolate(
    outTime: Time | undefined,
    outTf: Transform,
    lower: TimeAndTransform,
    upper: TimeAndTransform,
    time: Time,
  ): void {
    const [lowerTime, lowerTf] = lower;
    const [upperTime, upperTf] = upper;

    if (areEqual(lowerTime, upperTime)) {
      if (outTime) {
        copyTime(outTime, upperTime);
      }
      outTf.copy(upperTf);
      return;
    }

    // Interpolate times and transforms
    const fraction = Math.max(0, Math.min(1, percentOf(lowerTime, upperTime, time)));
    if (outTime) {
      copyTime(outTime, interpolate(lowerTime, upperTime, fraction));
    }
    Transform.Interpolate(outTf, lowerTf, upperTf, fraction);
  }

  static GetTransformMatrix(
    out: mat4,
    parentFrame: CoordinateFrame,
    childFrame: CoordinateFrame,
    time: Time,
    maxDelta: Duration,
  ): boolean {
    mat4.identity(out);

    let curFrame = childFrame;
    while (curFrame !== parentFrame) {
      if (!curFrame.findClosestTransforms(tempLower, tempUpper, time, maxDelta)) {
        return false;
      }
      CoordinateFrame.Interpolate(undefined, tempTransform, tempLower, tempUpper, time);
      mat4.multiply(out, tempTransform.matrix(), out);

      if (curFrame._parent == undefined) {
        throw new Error(`Frame "${parentFrame.id}" is not a parent of "${childFrame.id}"`);
      }
      curFrame = curFrame._parent;
    }

    return true;
  }

  static Apply(
    out: MutablePose,
    input: Pose,
    parent: CoordinateFrame,
    child: CoordinateFrame,
    // eslint-disable-next-line @foxglove/no-boolean-parameters
    invert: boolean,
    time: Time,
    maxDelta: Duration,
  ): boolean {
    if (!CoordinateFrame.GetTransformMatrix(tempMatrix, parent, child, time, maxDelta)) {
      return false;
    }
    if (invert) {
      // Remove the translation component, leaving only a rotation matrix
      const x = tempMatrix[12];
      const y = tempMatrix[13];
      const z = tempMatrix[14];
      tempMatrix[12] = 0;
      tempMatrix[13] = 0;
      tempMatrix[14] = 0;

      // The transpose of a rotation matrix is its inverse
      mat4.transpose(tempMatrix, tempMatrix);

      // The negatation of the translation is its inverse
      tempMatrix[12] = -x;
      tempMatrix[13] = -y;
      tempMatrix[14] = -z;
    }

    tempTransform.setPose(input);
    mat4.multiply(tempMatrix, tempMatrix, tempTransform.matrix());
    tempTransform.setMatrix(tempMatrix);
    tempTransform.toPose(out);
    return true;
  }
}

function copyTime(out: Time, time: Time): void {
  out.sec = time.sec;
  out.nsec = time.nsec;
}

function isDiffWithinDelta(timeA: Time, timeB: Time, delta: Duration): boolean {
  const diff = subtract(timeA, timeB);
  diff.sec = Math.abs(diff.sec);
  return compare(diff, delta) <= 0;
}
