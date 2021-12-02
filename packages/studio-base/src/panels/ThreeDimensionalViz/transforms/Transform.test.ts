// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { mat4, quat, vec3 } from "gl-matrix";

import { emptyPose } from "@foxglove/studio-base/util/Pose";

import { Transform } from "./Transform";

describe("Transform", () => {
  it("should create an instance", () => {
    const tf = new Transform(vec3.create(), quat.create());
    expect(tf.position()).toEqual(new Float32Array([0, 0, 0]));
    expect(tf.rotation()).toEqual(new Float32Array([0, 0, 0, 1]));
    expect(tf.matrix()).toEqual(new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]));
  });

  it("copy", () => {
    const tf = new Transform(vec3.fromValues(1, 2, 3), quat.fromValues(4, 5, 6, 7));
    const tf2 = new Transform(vec3.create(), quat.create());
    tf2.copy(tf);
    expect(tf2.position()).toEqual(new Float32Array([1, 2, 3]));
    expect(tf2.rotation()).toEqual(new Float32Array([4, 5, 6, 7]));
    expect(tf2.matrix()).toEqual(
      new Float32Array([-121, 124, -22, 0, -44, -103, 116, 0, 118, 4, -81, 0, 1, 2, 3, 1]),
    );
  });

  it("setPosition", () => {
    const tf = new Transform(vec3.fromValues(1, 2, 3), quat.fromValues(4, 5, 6, 7));
    tf.setPosition(vec3.fromValues(10, 20, 30));
    expect(tf.position()).toEqual(new Float32Array([10, 20, 30]));
    expect(tf.rotation()).toEqual(new Float32Array([4, 5, 6, 7]));
    expect(tf.matrix()).toEqual(
      new Float32Array([-121, 124, -22, 0, -44, -103, 116, 0, 118, 4, -81, 0, 10, 20, 30, 1]),
    );
  });

  it("setRotation", () => {
    const tf = new Transform(vec3.fromValues(1, 2, 3), quat.fromValues(4, 5, 6, 7));
    tf.setRotation(quat.fromValues(40, 50, 60, 70));
    expect(tf.position()).toEqual(new Float32Array([1, 2, 3]));
    expect(tf.rotation()).toEqual(new Float32Array([40, 50, 60, 70]));
    expect(tf.matrix()).toEqual(
      new Float32Array([
        -12199, 12400, -2200, 0, -4400, -10399, 11600, 0, 11800, 400, -8199, 0, 1, 2, 3, 1,
      ]),
    );
  });

  it("setPositionRotation", () => {
    const tf = new Transform(vec3.fromValues(1, 2, 3), quat.fromValues(4, 5, 6, 7));
    tf.setPositionRotation(vec3.fromValues(10, 20, 30), quat.fromValues(40, 50, 60, 70));
    expect(tf.position()).toEqual(new Float32Array([10, 20, 30]));
    expect(tf.rotation()).toEqual(new Float32Array([40, 50, 60, 70]));
    expect(tf.matrix()).toEqual(
      new Float32Array([
        -12199, 12400, -2200, 0, -4400, -10399, 11600, 0, 11800, 400, -8199, 0, 10, 20, 30, 1,
      ]),
    );
  });

  it("setMatrix", () => {
    const tf = new Transform(vec3.fromValues(1, 2, 3), quat.fromValues(4, 5, 6, 7));
    tf.setMatrix(
      new Float32Array([
        -12199, 12400, -2200, 0, -4400, -10399, 11600, 0, 11800, 400, -8199, 0, 10, 20, 30, 1,
      ]),
    );
    expect(tf.position()).toEqual(new Float32Array([10, 20, 30]));
    expect(tf.rotation()).toEqual(
      new Float32Array([
        0.26152369379997253, 0.27993905544281006, 0.6647845506668091, 0.36817529797554016,
      ]),
    );
    expect(tf.matrix()).toEqual(
      new Float32Array([
        -12199, 12400, -2200, 0, -4400, -10399, 11600, 0, 11800, 400, -8199, 0, 10, 20, 30, 1,
      ]),
    );

    tf.setMatrix(mat4.fromValues(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1));
    expect(tf.position()).toEqual(new Float32Array([0, 0, 0]));
    expect(tf.rotation()).toEqual(new Float32Array([0, 0, 0, 1]));
    expect(tf.matrix()).toEqual(new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]));
  });

  it("setPose", () => {
    const tf = new Transform(vec3.create(), quat.create());
    tf.setPose({ position: { x: 1, y: 2, z: 3 }, orientation: { x: 4, y: 5, z: 6, w: 7 } });
    expect(tf.position()).toEqual(new Float32Array([1, 2, 3]));
    expect(tf.rotation()).toEqual(new Float32Array([4, 5, 6, 7]));
    expect(tf.matrix()).toEqual(
      new Float32Array([-121, 124, -22, 0, -44, -103, 116, 0, 118, 4, -81, 0, 1, 2, 3, 1]),
    );
  });

  it("toPose", () => {
    const tf = new Transform(vec3.fromValues(1, 2, 3), quat.fromValues(4, 5, 6, 7));
    const pose = emptyPose();
    tf.toPose(pose);
    expect(pose.position).toEqual({ x: 1, y: 2, z: 3 });
    expect(pose.orientation).toEqual({ x: 4, y: 5, z: 6, w: 7 });
  });
});
