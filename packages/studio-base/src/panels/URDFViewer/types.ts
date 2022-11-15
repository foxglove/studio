// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as THREE from "three";

export type CameraState = {
  distance: number;
  perspective: boolean;
  phi: number;
  target: readonly [number, number, number];
  targetOffset: readonly [number, number, number];
  targetOrientation: readonly [number, number, number, number];
  thetaOffset: number;
  fovy: number;
  near: number;
  far: number;
};

export type EventTypes = {
  cameraMove: (center: THREE.Vector3) => void;
};

export type Config = {
  jointStatesTopic?: string;
  customJointValues?: Record<string, number>;
  opacity?: number;
  selectedAssetId?: string;
};

export const DATA_TYPES = Object.freeze([
  "sensor_msgs/JointState",
  "sensor_msgs/msg/JointState",
  "ros.sensor_msgs.JointState",
]);
