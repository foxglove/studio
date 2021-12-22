// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { RosMsgDefinition } from "@foxglove/rosmsg";
import { MessageEvent, Topic } from "@foxglove/studio";
import PanelSetup from "@foxglove/studio-base/stories/PanelSetup";
import { TF } from "@foxglove/studio-base/types/Messages";

import ThreeDimensionalViz from "./index";

export default {
  title: "panels/ThreeDimensionalViz",
  component: ThreeDimensionalViz,
};

export function Default(): JSX.Element {
  return (
    <PanelSetup>
      <ThreeDimensionalViz
        overrideConfig={{
          ...ThreeDimensionalViz.defaultConfig,
          customBackgroundColor: "#2d7566",
        }}
      />
    </PanelSetup>
  );
}

export function CustomBackgroundColor(): JSX.Element {
  return (
    <PanelSetup>
      <ThreeDimensionalViz
        overrideConfig={{
          ...ThreeDimensionalViz.defaultConfig,
          useThemeBackgroundColor: false,
          customBackgroundColor: "#2d7566",
        }}
      />
    </PanelSetup>
  );
}

export function TransformInterpolation(): JSX.Element {
  const datatypes = new Map<string, RosMsgDefinition>(
    Object.entries({
      "geometry_msgs/TransformStamped": {
        definitions: [
          { name: "header", type: "std_msgs/Header" },
          { name: "transform", type: "geometry_msgs/Transform" },
        ],
      },
      "std_msgs/Header": {
        definitions: [
          { name: "seq", type: "uint32" },
          { name: "stamp", type: "time" },
          { name: "frame_id", type: "string" },
        ],
      },
      "geometry_msgs/Transform": {
        definitions: [
          { name: "translation", type: "geometry_msgs/Vector3" },
          { name: "rotation", type: "geometry_msgs/Quaternion" },
        ],
      },
      "geometry_msgs/Vector3": {
        definitions: [
          { name: "x", type: "float64" },
          { name: "y", type: "float64" },
          { name: "z", type: "float64" },
        ],
      },
      "geometry_msgs/Quaternion": {
        definitions: [
          { name: "x", type: "float64" },
          { name: "y", type: "float64" },
          { name: "z", type: "float64" },
          { name: "w", type: "float64" },
        ],
      },
    }),
  );
  const topics: Topic[] = [{ name: "/tf", datatype: "geometry_msgs/TransformStamped" }];
  const tf_t1: MessageEvent<TF> = {
    topic: "/tf",
    receiveTime: { sec: 10, nsec: 0 },
    message: {
      header: { seq: 0, stamp: { sec: 1, nsec: 0 }, frame_id: "map" },
      child_frame_id: "base_link",
      transform: {
        translation: { x: 1, y: 2, z: 3 },
        rotation: { x: 0, y: 0, z: Math.SQRT1_2, w: Math.SQRT1_2 },
      },
    },
    sizeInBytes: 0,
  };
  const tf_t3: MessageEvent<TF> = {
    topic: "/tf",
    receiveTime: { sec: 10, nsec: 0 },
    message: {
      header: { seq: 0, stamp: { sec: 3, nsec: 0 }, frame_id: "map" },
      child_frame_id: "base_link",
      transform: {
        translation: { x: 2, y: 2, z: 3 },
        rotation: { x: 0, y: 0, z: 1, w: 0 },
      },
    },
    sizeInBytes: 0,
  };

  return (
    <PanelSetup
      fixture={{
        datatypes,
        topics,
        frame: {
          "/tf": [tf_t1, tf_t3],
        },
        capabilities: [],
        activeData: {
          datatypes,
          topics,
          startTime: { sec: 0, nsec: 0 },
          endTime: { sec: 10, nsec: 0 },
          currentTime: { sec: 2, nsec: 0 },
          messages: [tf_t1, tf_t3],

          // Some or all of this can probably be removed once this is working
          messageOrder: "receiveTime",
          isPlaying: true,
          speed: 1,
          lastSeekTime: 1,
          parsedMessageDefinitionsByTopic: {},
          totalBytesReceived: 0,
        },
      }}
    >
      <ThreeDimensionalViz
        overrideConfig={{
          ...ThreeDimensionalViz.defaultConfig,
          checkedKeys: ["name:Topics", "t:/tf"],
          expandedKeys: ["name:Topics", "t:/tf"],
          followTf: "base_link",
          modifiedNamespaceTopics: ["/tf"],
        }}
      />
    </PanelSetup>
  );
}

TransformInterpolation.parameters = { colorScheme: "dark" };
