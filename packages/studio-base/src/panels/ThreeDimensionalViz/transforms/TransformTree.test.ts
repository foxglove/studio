// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

// import { mat4, quat, vec3 } from "gl-matrix";

import { emptyPose } from "@foxglove/studio-base/util/Pose";

import { Transform } from "./Transform";
import { TransformTree } from "./TransformTree";

describe("TransformTree", () => {
  it("should create an instance", () => {
    const tree = new TransformTree();
    expect(tree.frame("")).toBeUndefined();
    expect(tree.frame("test")).toBeUndefined();
    expect(tree.frames().size).toBe(0);
    expect(tree.hasFrame("")).toBe(false);
    expect(tree.hasFrame("test")).toBe(false);
  });

  it("getOrCreateFrame", () => {
    const tree = new TransformTree();
    const baseLink = tree.getOrCreateFrame("base_link");
    expect(baseLink.id).toBe("base_link");
    expect(baseLink.parent()).toBeUndefined();
    expect(baseLink.hasParent("base_link")).toBe(false);
    expect(baseLink.maxStorageTime).toEqual({ sec: 10, nsec: 0 });
    expect(baseLink.findAncestor("base_link")).toBeUndefined();

    expect(tree.hasFrame("")).toBe(false);
    expect(tree.hasFrame("base_link")).toBe(true);
    expect(tree.frame("base_link")).toBe(baseLink);
    expect(tree.frames().size).toBe(1);
  });

  it("point-in-time transformation", () => {
    const TIME_ZERO = { sec: 0, nsec: 0 };
    const EMPTY_POSE = emptyPose();

    const tree = new TransformTree();
    const map_T_odom = new Transform([0, 0, 0], [0, 0, 0, 1]);
    const odom_T_baseLink = new Transform([0, 0, 0], [0, 0, 0, 1]);
    tree.addTransform("base_link", "odom", TIME_ZERO, odom_T_baseLink);
    tree.addTransform("odom", "map", TIME_ZERO, map_T_odom);
    expect(tree.hasFrame("base_link")).toBe(true);
    expect(tree.hasFrame("odom")).toBe(true);
    expect(tree.hasFrame("map")).toBe(true);
    expect(tree.hasFrame("")).toBe(false);

    // Identity transforms from base_link -> odom -> map
    const baseLink = tree.frame("base_link")!;
    const map = tree.frame("map")!;
    const output = emptyPose();
    expect(map.apply(output, emptyPose(), baseLink, TIME_ZERO, TIME_ZERO)).toBe(true);
    expect(output.position).toEqual(EMPTY_POSE.position);
    expect(output.orientation).toEqual(EMPTY_POSE.orientation);

    // Identity transforms from map -> odom -> base_link
    expect(baseLink.apply(output, emptyPose(), map, TIME_ZERO, TIME_ZERO)).toBe(true);
    expect(output.position).toEqual(EMPTY_POSE.position);
    expect(output.orientation).toEqual(EMPTY_POSE.orientation);

    // Can't reparent base_link -> map after base_link -> odom already exists
    expect(() => tree.addTransform("base_link", "map", TIME_ZERO, odom_T_baseLink)).toThrow();

    // This demonstrates that transforms are stored by reference, not by value.
    // Although this works, it's better practice to call addTransform() again
    // with the same timestamp and a new transform
    odom_T_baseLink.setPosition([1, 2, 3]);
    map_T_odom.setPosition([10, 20, 30]);
    map_T_odom.setRotation([0, 0, 1, 0]); // Rotate 180 degrees around z axis

    expect(map.apply(output, emptyPose(), baseLink, TIME_ZERO, TIME_ZERO)).toBe(true);
    expect(output.position).toEqual({ x: 9, y: 18, z: 33 });
    expect(output.orientation).toEqual({ x: 0, y: 0, z: 1, w: 0 });

    expect(baseLink.apply(output, emptyPose(), map, TIME_ZERO, TIME_ZERO)).toBe(true);
    expect(output.position).toEqual({ x: -9, y: -18, z: -33 });
    expect(output.orientation).toEqual({ x: 0, y: 0, z: 1, w: 0 });

    const a = { position: { x: 100, y: 200, z: 300 }, orientation: { x: 1, y: 0, z: 0, w: 0 } };
    expect(map.apply(output, a, baseLink, TIME_ZERO, TIME_ZERO)).toBe(true);
    expect(output.position).toEqual({ x: -91, y: -182, z: 333 });
    expect(output.orientation).toEqual({ x: 0, y: 1, z: 0, w: 0 });

    expect(baseLink.apply(output, a, map, TIME_ZERO, TIME_ZERO)).toBe(true);
    expect(output.position).toEqual({ x: -109, y: -218, z: 267 });
    expect(output.orientation).toEqual({ x: 0, y: 1, z: 0, w: 0 });
  });
});
