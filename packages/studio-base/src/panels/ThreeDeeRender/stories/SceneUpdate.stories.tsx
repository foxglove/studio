// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { FrameTransform, SceneUpdate } from "@foxglove/schemas/schemas/typescript";
import { MessageEvent, Topic } from "@foxglove/studio";
import { xyzrpyToPose } from "@foxglove/studio-base/panels/ThreeDeeRender/transforms";
import PanelSetup from "@foxglove/studio-base/stories/PanelSetup";

import ThreeDeeRender from "../index";
import { makeColor, QUAT_IDENTITY, rad2deg, SENSOR_FRAME_ID } from "./common";

export default {
  title: "panels/ThreeDeeRender/SceneUpdate",
  component: ThreeDeeRender,
};

BasicEntities.parameters = { colorScheme: "light", chromatic: { delay: 100 } };
export function BasicEntities(): JSX.Element {
  const topics: Topic[] = [
    { name: "transforms", datatype: "foxglove.FrameTransform" },
    { name: "scene", datatype: "foxglove.SceneUpdate" },
  ];

  const tf1: MessageEvent<FrameTransform> = {
    topic: "transforms",
    receiveTime: { sec: 10, nsec: 0 },
    message: {
      timestamp: { sec: 0, nsec: 0 },
      parent_frame_id: "map",
      child_frame_id: "base_link",
      translation: { x: 1e7, y: 0, z: 0 },
      rotation: QUAT_IDENTITY,
    },
    sizeInBytes: 0,
  };
  const tf2: MessageEvent<FrameTransform> = {
    topic: "transforms",
    receiveTime: { sec: 10, nsec: 0 },
    message: {
      timestamp: { sec: 0, nsec: 0 },
      parent_frame_id: "base_link",
      child_frame_id: SENSOR_FRAME_ID,
      translation: { x: 0, y: 1, z: 0 },
      rotation: QUAT_IDENTITY,
    },
    sizeInBytes: 0,
  };

  const entity1: MessageEvent<SceneUpdate> = {
    topic: "scene",
    receiveTime: { sec: 10, nsec: 0 },
    message: {
      deletions: [],
      entities: [
        {
          timestamp: { sec: 0, nsec: 0 },
          frame_id: SENSOR_FRAME_ID,
          id: "entity1",
          lifetime: { sec: 0, nsec: 0 },
          frame_locked: true,
          metadata: [],
          arrows: [],
          cubes: [
            {
              pose: xyzrpyToPose([0, 0, 0], [0, 0, 0]),
              size: { x: 0.8, y: 0.5, z: 1 },
              color: makeColor("#f44336", 0.5),
            },
            {
              pose: xyzrpyToPose([1, 0, 0], [0, 0, 10]),
              size: { x: 0.4, y: 0.2, z: 1 },
              color: makeColor("#afe663", 0.9),
            },
          ],
          spheres: [],
          cylinders: [],
          lines: [],
          triangles: [],
          texts: [],
          models: [],
        },
      ],
    },
    sizeInBytes: 0,
  };

  const fixture = {
    topics,
    frame: {
      transforms: [tf1, tf2],
      scene: [entity1],
    },
    capabilities: [],
    activeData: {
      currentTime: { sec: 0, nsec: 0 },
    },
  };

  return (
    <PanelSetup fixture={fixture}>
      <ThreeDeeRender
        overrideConfig={{
          ...ThreeDeeRender.defaultConfig,
          followTf: "base_link",
          layers: {
            grid: { layerId: "foxglove.Grid" },
          },
          cameraState: {
            distance: 5.5,
            perspective: true,
            phi: rad2deg(0.5),
            targetOffset: [-0.5, 0.75, 0],
            thetaOffset: rad2deg(-0.25),
            fovy: rad2deg(0.75),
            near: 0.01,
            far: 5000,
            target: [0, 0, 0],
            targetOrientation: [0, 0, 0, 1],
          },
          topics: {
            scene: { visible: true },
          },
        }}
      />
    </PanelSetup>
  );
}
