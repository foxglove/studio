// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
//
// This file incorporates work covered by the following copyright and
// permission notice:
//
//   Copyright 2018-2021 Cruise LLC
//
//   This source code is licensed under the Apache License, Version 2.0,
//   found at http://www.apache.org/licenses/LICENSE-2.0
//   You may not use this file except in compliance with the License.

import { isEqual } from "lodash";

import {
  UrdfGeometryBox,
  UrdfGeometryCylinder,
  UrdfGeometryMesh,
  UrdfGeometrySphere,
  UrdfJoint,
  UrdfRobot,
  UrdfVisual,
  parseRobot,
} from "@foxglove/den/urdf";
import Logger from "@foxglove/log";
import { rewritePackageUrl } from "@foxglove/studio-base/context/AssetsContext";
import { TopicSettingsCollection } from "@foxglove/studio-base/panels/ThreeDimensionalViz/SceneBuilder";
import { UrdfSettings } from "@foxglove/studio-base/panels/ThreeDimensionalViz/TopicSettingsEditor/UrdfSettingsEditor";
import Transforms from "@foxglove/studio-base/panels/ThreeDimensionalViz/Transforms";
import {
  Color,
  CubeMarker,
  CylinderMarker,
  MeshMarker,
  SphereMarker,
  TF,
} from "@foxglove/studio-base/types/Messages";
import { MarkerProvider, MarkerCollector } from "@foxglove/studio-base/types/Scene";
import { URDF_TOPIC } from "@foxglove/studio-base/util/globalConstants";

export const DEFAULT_COLOR: Color = { r: 36 / 255, g: 142 / 255, b: 255 / 255, a: 1 };

type Vector3 = { x: number; y: number; z: number };
type Quaternion = { x: number; y: number; z: number; w: number };

const log = Logger.getLogger(__filename);

export default class UrdfBuilder implements MarkerProvider {
  private _urdf?: UrdfRobot;
  private _boxes: CubeMarker[] = [];
  private _spheres: SphereMarker[] = [];
  private _cylinders: CylinderMarker[] = [];
  private _meshes: MeshMarker[] = [];
  private _visible = true;
  private _settings: UrdfSettings = {};

  constructor() {}

  renderMarkers = (add: MarkerCollector): void => {
    if (this._visible) {
      for (const box of this._boxes) {
        add.cube(box);
      }
      for (const sphere of this._spheres) {
        add.sphere(sphere);
      }
      for (const cylinder of this._cylinders) {
        add.cylinder(cylinder);
      }
      for (const mesh of this._meshes) {
        add.mesh(mesh);
      }
    }
  };

  updateTransforms(transforms: Transforms): void {
    if (!this._urdf) {
      return;
    }

    for (const joint of this._urdf.joints.values()) {
      const tf: TF = {
        header: {
          frame_id: joint.parent,
          stamp: { sec: 0, nsec: 0 },
          seq: 0,
        },
        child_frame_id: joint.child,
        transform: {
          translation: joint.origin.xyz,
          rotation: eulerToQuaternion(joint.origin.rpy),
        },
      };
      transforms.consume(tf);
    }
  }

  // eslint-disable-next-line @foxglove/no-boolean-parameters
  setVisible(isVisible: boolean): void {
    this._visible = isVisible;
  }

  setSettingsByKey(settings: TopicSettingsCollection, rosPackagePath: string | undefined): void {
    const newSettings = settings[`t:${URDF_TOPIC}`] ?? {};
    if (!isEqual(newSettings, this._settings)) {
      this._settings = newSettings;

      this._boxes = [];
      this._spheres = [];
      this._cylinders = [];
      this._meshes = [];

      if (this._settings.urdfUrl && isUrdfUrlValid(this._settings.urdfUrl)) {
        void this.fetchUrdf(this._settings.urdfUrl, rosPackagePath);
      } else {
        this._urdf = undefined;
      }
    }
  }

  async fetchUrdf(url: string, rosPackagePath: string | undefined): Promise<void> {
    let text: string;
    try {
      const fetchUrl = rewritePackageUrl(url, { rosPackagePath });
      const res = await fetch(fetchUrl);
      text = await res.text();
    } catch (err) {
      throw new Error(`Failed to fetch URDF from "${url}": ${err}`);
    }

    if (!text) {
      throw new Error(`Did noy fetch any URDF data from "${url}"`);
    }

    const fileFetcher = getFileFetch(rosPackagePath);

    try {
      this._urdf = await parseRobot(text, fileFetcher);
      this.createMarkers(this._urdf);
    } catch (err) {
      throw new Error(`Failed to parse URDF from "${url}": ${err}`);
    }
  }

  createMarkers(urdf: UrdfRobot): void {
    const childToJoint = new Map<string, UrdfJoint>();
    for (const joint of urdf.joints.values()) {
      childToJoint.set(joint.child, joint);
    }

    for (const link of urdf.links.values()) {
      const joint = childToJoint.get(link.name);
      if (!joint) {
        log.warn(`No joint found for link ${link.name}`);
        continue;
      }

      let i = 0;
      for (const visual of link.visuals) {
        const id = `${link.name}-visual${i++}-${visual.geometry.geometryType}`;
        switch (visual.geometry.geometryType) {
          case "box":
            this._boxes.push(UrdfBuilder.BuildBox(id, visual, joint));
            break;
          case "sphere":
            this._spheres.push(UrdfBuilder.BuildSphere(id, visual, joint));
            break;
          case "cylinder":
            this._cylinders.push(UrdfBuilder.BuildCylinder(id, visual, joint));
            break;
          case "mesh":
            this._meshes.push(UrdfBuilder.BuildMesh(id, visual, joint));
            break;
        }
      }
    }
  }

  static BuildBox(id: string, visual: UrdfVisual, joint: UrdfJoint): CubeMarker {
    const box = visual.geometry as UrdfGeometryBox;
    const marker: CubeMarker = {
      type: 1,
      header: { frame_id: joint.parent, stamp: { sec: 0, nsec: 0 }, seq: 0 },
      ns: "urdf-box",
      id,
      action: 0,
      pose: {
        position: visual.origin.xyz,
        orientation: { x: 0, y: 0, z: 0, w: 1 }, // Convert Euler rpy to quaternion
      },
      scale: box.size,
      color: visual.material?.color ?? DEFAULT_COLOR,
      frame_locked: false,
      // scaleInvariant: true,
    };
    return marker;
  }

  static BuildSphere(id: string, visual: UrdfVisual, joint: UrdfJoint): SphereMarker {
    const sphere = visual.geometry as UrdfGeometrySphere;
    const marker: SphereMarker = {
      type: 2,
      header: { frame_id: joint.parent, stamp: { sec: 0, nsec: 0 }, seq: 0 },
      ns: "urdf-sphere",
      id,
      action: 0,
      pose: {
        position: visual.origin.xyz,
        orientation: { x: 0, y: 0, z: 0, w: 1 }, // Convert Euler rpy to quaternion
      },
      scale: { x: sphere.radius, y: sphere.radius, z: sphere.radius },
      color: visual.material?.color ?? DEFAULT_COLOR,
      frame_locked: false,
      // scaleInvariant: true,
    };
    return marker;
  }

  static BuildCylinder(id: string, visual: UrdfVisual, joint: UrdfJoint): CylinderMarker {
    const cylinder = visual.geometry as UrdfGeometryCylinder;
    const marker: CylinderMarker = {
      type: 3,
      header: { frame_id: joint.parent, stamp: { sec: 0, nsec: 0 }, seq: 0 },
      ns: "urdf-cylinder",
      id,
      action: 0,
      pose: {
        position: visual.origin.xyz,
        orientation: { x: 0, y: 0, z: 0, w: 1 }, // Convert Euler rpy to quaternion
      },
      scale: { x: cylinder.radius, y: cylinder.length, z: cylinder.radius },
      color: visual.material?.color ?? DEFAULT_COLOR,
      frame_locked: false,
      // scaleInvariant: true,
    };
    return marker;
  }

  static BuildMesh(id: string, visual: UrdfVisual, joint: UrdfJoint): MeshMarker {
    const mesh = visual.geometry as UrdfGeometryMesh;
    const marker: MeshMarker = {
      type: 10,
      header: { frame_id: joint.parent, stamp: { sec: 0, nsec: 0 }, seq: 0 },
      ns: "urdf-mesh",
      id,
      action: 0,
      pose: {
        position: visual.origin.xyz,
        orientation: { x: 0, y: 0, z: 0, w: 1 }, // Convert Euler rpy to quaternion
      },
      scale: mesh.scale ?? { x: 1, y: 1, z: 1 },
      color: visual.material?.color ?? DEFAULT_COLOR,
      frame_locked: false,
      // scaleInvariant: true,
      mesh_resource: mesh.filename,
      mesh_use_embedded_materials: true,
    };
    return marker;
  }
}

function isUrdfUrlValid(str: string): boolean {
  try {
    const url = new URL(str);
    return (
      (url.protocol === "package:" || url.protocol === "http:" || url.protocol === "https:") &&
      (url.pathname.endsWith(".urdf") ||
        url.pathname.endsWith(".xacro") ||
        url.pathname.endsWith(".xml"))
    );
  } catch (e) {
    return false;
  }
}

function getFileFetch(rosPackagePath: string | undefined): (url: string) => Promise<string> {
  return async (url: string) => {
    try {
      log.debug(`fetch(${url}) requested`);
      const fetchUrl = rewritePackageUrl(url, { rosPackagePath });
      const res = await fetch(fetchUrl);
      return await res.text();
    } catch (err) {
      throw new Error(`Failed to fetch "${url}": ${err}`);
    }
  };
}

function eulerToQuaternion(rpy: Vector3): Quaternion {
  const roll = rpy.x;
  const pitch = rpy.y;
  const yaw = rpy.z;

  const cy = Math.cos(yaw * 0.5);
  const sy = Math.sin(yaw * 0.5);
  const cr = Math.cos(roll * 0.5);
  const sr = Math.sin(roll * 0.5);
  const cp = Math.cos(pitch * 0.5);
  const sp = Math.sin(pitch * 0.5);

  const w = cy * cr * cp + sy * sr * sp;
  const x = cy * sr * cp - sy * cr * sp;
  const y = cy * cr * sp + sy * sr * cp;
  const z = sy * cr * cp - cy * sr * sp;

  return { x, y, z, w };
}
