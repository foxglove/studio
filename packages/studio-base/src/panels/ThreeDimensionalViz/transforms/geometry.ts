// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import type { vec3, quat, mat4, ReadonlyMat4 } from "gl-matrix";

// Helper functions for constructing geometry primitives that can be used with
// gl-matrix. These methods are preferred over the gl-matrix equivalents since
// they produce number[] arrays instead of Float32Array, which have less
// precision and are slower (float32 requires upcasting/downcasting to do math
// in JavaScript).

// ts-prune-ignore-next
export function vec3Identity(): vec3 {
  return [0, 0, 0];
}

// ts-prune-ignore-next
export function vec3FromValues(x: number, y: number, z: number): vec3 {
  return [x, y, z];
}

// ts-prune-ignore-next
export function vec3Clone(a: vec3): vec3 {
  return [a[0], a[1], a[2]];
}

// ts-prune-ignore-next
export function quatIdentity(): quat {
  return [0, 0, 0, 1];
}

// ts-prune-ignore-next
export function quatFromValues(x: number, y: number, z: number, w: number): quat {
  return [x, y, z, w];
}

// ts-prune-ignore-next
export function quatClone(q: quat): quat {
  return [q[0], q[1], q[2], q[3]];
}

// ts-prune-ignore-next
export function mat4Identity(): mat4 {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

// ts-prune-ignore-next
export function mat4FromValues(
  m00: number,
  m01: number,
  m02: number,
  m03: number,
  m10: number,
  m11: number,
  m12: number,
  m13: number,
  m20: number,
  m21: number,
  m22: number,
  m23: number,
  m30: number,
  m31: number,
  m32: number,
  m33: number,
): mat4 {
  return [m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33];
}

// ts-prune-ignore-next
export function mat4Clone(m: mat4): mat4 {
  return [
    m[0],
    m[1],
    m[2],
    m[3],
    m[4],
    m[5],
    m[6],
    m[7],
    m[8],
    m[9],
    m[10],
    m[11],
    m[12],
    m[13],
    m[14],
    m[15],
  ];
}

/**
 * Returns a quaternion representing the rotational component of a
 * transformation matrix. The matrix scaling must be precomputed and passed in
 * @param out Quaternion to receive the rotation component
 * @param mat Matrix to be decomposed (input)
 * @param scaling Scaling of the matrix (input)
 * @return out
 */
export function getRotationWithScaling(out: quat, mat: ReadonlyMat4, scaling: vec3): quat {
  const is1 = 1 / scaling[0];
  const is2 = 1 / scaling[1];
  const is3 = 1 / scaling[2];
  const sm11 = mat[0] * is1;
  const sm12 = mat[1] * is2;
  const sm13 = mat[2] * is3;
  const sm21 = mat[4] * is1;
  const sm22 = mat[5] * is2;
  const sm23 = mat[6] * is3;
  const sm31 = mat[8] * is1;
  const sm32 = mat[9] * is2;
  const sm33 = mat[10] * is3;
  const trace = sm11 + sm22 + sm33;
  let S = 0;
  if (trace > 0) {
    S = Math.sqrt(trace + 1.0) * 2;
    out[3] = 0.25 * S;
    out[0] = (sm23 - sm32) / S;
    out[1] = (sm31 - sm13) / S;
    out[2] = (sm12 - sm21) / S;
  } else if (sm11 > sm22 && sm11 > sm33) {
    S = Math.sqrt(1.0 + sm11 - sm22 - sm33) * 2;
    out[3] = (sm23 - sm32) / S;
    out[0] = 0.25 * S;
    out[1] = (sm12 + sm21) / S;
    out[2] = (sm31 + sm13) / S;
  } else if (sm22 > sm33) {
    S = Math.sqrt(1.0 + sm22 - sm11 - sm33) * 2;
    out[3] = (sm31 - sm13) / S;
    out[0] = (sm12 + sm21) / S;
    out[1] = 0.25 * S;
    out[2] = (sm23 + sm32) / S;
  } else {
    S = Math.sqrt(1.0 + sm33 - sm11 - sm22) * 2;
    out[3] = (sm12 - sm21) / S;
    out[0] = (sm31 + sm13) / S;
    out[1] = (sm23 + sm32) / S;
    out[2] = 0.25 * S;
  }
  return out;
}
