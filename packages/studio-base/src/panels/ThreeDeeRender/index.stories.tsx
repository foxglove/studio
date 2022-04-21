// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { MessageEvent, Topic } from "@foxglove/studio";
import useDelayedFixture from "@foxglove/studio-base/panels/ThreeDimensionalViz/stories/useDelayedFixture";
import PanelSetup from "@foxglove/studio-base/stories/PanelSetup";
import {
  ArrowMarker,
  CubeListMarker,
  CubeMarker,
  CylinderMarker,
  LineListMarker,
  LineStripMarker,
  PointsMarker,
  SphereListMarker,
  SphereMarker,
  TextMarker,
  TF,
  TriangleListMarker,
} from "@foxglove/studio-base/types/Messages";
import { hexToColorObj } from "@foxglove/studio-base/util/colorUtils";

import ThreeDeeRender from "./index";

const QUAT_IDENTITY = { x: 0, y: 0, z: 0, w: 1 };

function makeColor(hex: string, alpha?: number) {
  return hexToColorObj(hex, alpha);
}

export default {
  title: "panels/ThreeDeeRender",
  component: ThreeDeeRender,
};

const SENSOR_FRAME_ID = "base_link";
const FIXED_FRAME_ID = "map";

Markers.parameters = { colorScheme: "dark", chromatic: { delay: 100 } };
export function Markers(): JSX.Element {
  const topics: Topic[] = [
    { name: "/tf", datatype: "geometry_msgs/TransformStamped" },
    { name: "/markers", datatype: "visualization_msgs/Marker" },
  ];

  const tf1: MessageEvent<TF> = {
    topic: "/tf",
    receiveTime: { sec: 10, nsec: 0 },
    message: {
      header: { seq: 0, stamp: { sec: 0, nsec: 0 }, frame_id: SENSOR_FRAME_ID },
      child_frame_id: FIXED_FRAME_ID,
      transform: {
        translation: { x: 1e7, y: 0, z: 0 },
        rotation: QUAT_IDENTITY,
      },
    },
    sizeInBytes: 0,
  };

  const arrow: MessageEvent<ArrowMarker> = {
    topic: "/markers",
    receiveTime: { sec: 10, nsec: 0 },
    message: {
      header: { seq: 0, stamp: { sec: 0, nsec: 0 }, frame_id: SENSOR_FRAME_ID },
      id: `arrow`,
      ns: "",
      type: 0,
      action: 0,
      frame_locked: false,
      pose: {
        position: { x: -2, y: 1, z: 0 },
        orientation: { x: 0, y: 0, z: 0, w: 1 },
      },
      scale: { x: 0.5, y: 0.1, z: 0.1 },
      color: makeColor("#f44336", 0.5),
      lifetime: { sec: 0, nsec: 0 },
    },
    sizeInBytes: 0,
  };

  const cube: MessageEvent<CubeMarker> = {
    topic: "/markers",
    receiveTime: { sec: 10, nsec: 0 },
    message: {
      header: { seq: 0, stamp: { sec: 0, nsec: 0 }, frame_id: SENSOR_FRAME_ID },
      id: `cube`,
      ns: "",
      type: 1,
      action: 0,
      frame_locked: false,
      pose: {
        position: { x: -1, y: 1, z: 0 },
        orientation: { x: 0, y: 0, z: 0, w: 1 },
      },
      scale: { x: 0.5, y: 0.5, z: 0.5 },
      color: makeColor("#e81e63", 0.5),
      lifetime: { sec: 0, nsec: 0 },
    },
    sizeInBytes: 0,
  };

  const sphere: MessageEvent<SphereMarker> = {
    topic: "/markers",
    receiveTime: { sec: 10, nsec: 0 },
    message: {
      header: { seq: 0, stamp: { sec: 0, nsec: 0 }, frame_id: SENSOR_FRAME_ID },
      id: `sphere`,
      ns: "",
      type: 2,
      action: 0,
      frame_locked: false,
      pose: {
        position: { x: 0, y: 1, z: 0 },
        orientation: { x: 0, y: 0, z: 0, w: 1 },
      },
      scale: { x: 0.5, y: 0.5, z: 0.5 },
      color: makeColor("#9c27b0", 0.5),
      lifetime: { sec: 0, nsec: 0 },
    },
    sizeInBytes: 0,
  };

  const cylinder: MessageEvent<CylinderMarker> = {
    topic: "/markers",
    receiveTime: { sec: 10, nsec: 0 },
    message: {
      header: { seq: 0, stamp: { sec: 0, nsec: 0 }, frame_id: SENSOR_FRAME_ID },
      id: `cylinder`,
      ns: "",
      type: 3,
      action: 0,
      frame_locked: false,
      pose: {
        position: { x: 1, y: 1, z: 0 },
        orientation: { x: 0, y: 0, z: 0, w: 1 },
      },
      scale: { x: 0.5, y: 0.5, z: 0.5 },
      color: makeColor("#673ab7", 0.5),
      lifetime: { sec: 0, nsec: 0 },
    },
    sizeInBytes: 0,
  };

  const lineStrip: MessageEvent<LineStripMarker> = {
    topic: "/markers",
    receiveTime: { sec: 10, nsec: 0 },
    message: {
      header: { seq: 0, stamp: { sec: 0, nsec: 0 }, frame_id: SENSOR_FRAME_ID },
      id: `lineStrip`,
      ns: "",
      type: 4,
      action: 0,
      frame_locked: false,
      pose: {
        position: { x: -2, y: 0, z: 0 },
        orientation: { x: 0, y: 0, z: 0, w: 1 },
      },
      scale: { x: 0.1, y: 0.1, z: 0.1 },
      color: makeColor("#3f51b5", 0.5),
      points: [
        { x: 0, y: 0.25, z: 0 },
        { x: 0.25, y: -0.25, z: 0 },
        { x: -0.25, y: -0.25, z: 0 },
        { x: 0, y: 0.25, z: 0 },
      ],
      colors: [
        makeColor("#f44336", 0.5),
        makeColor("#4caf50", 1),
        makeColor("#2196f3", 1),
        makeColor("#ffeb3b", 0.5),
      ],
      lifetime: { sec: 0, nsec: 0 },
    },
    sizeInBytes: 0,
  };

  const lineList: MessageEvent<LineListMarker> = {
    topic: "/markers",
    receiveTime: { sec: 10, nsec: 0 },
    message: {
      header: { seq: 0, stamp: { sec: 0, nsec: 0 }, frame_id: SENSOR_FRAME_ID },
      id: `lineList`,
      ns: "",
      type: 5,
      action: 0,
      frame_locked: false,
      pose: {
        position: { x: -1, y: 0, z: 0 },
        orientation: { x: 0, y: 0, z: 0, w: 1 },
      },
      scale: { x: 0.1, y: 0.1, z: 0.1 },
      color: makeColor("#4caf50", 1),
      points: [
        { x: 0, y: 0.25, z: 0 },
        { x: 0.25, y: -0.25, z: 0 },
        { x: 0.25, y: -0.25, z: 0 },
        { x: -0.25, y: -0.25, z: 0 },
        { x: -0.25, y: -0.25, z: 0 },
        { x: 0, y: 0.25, z: 0 },
      ],
      colors: [
        makeColor("#f44336", 0.5),
        makeColor("#4caf50", 0.5),
        makeColor("#2196f3", 1),
        makeColor("#ffeb3b", 1),
        makeColor("#e81e63", 0.5),
        makeColor("#3f51b5", 0.5),
      ],
      lifetime: { sec: 0, nsec: 0 },
    },
    sizeInBytes: 0,
  };

  const cubeList: MessageEvent<CubeListMarker> = {
    topic: "/markers",
    receiveTime: { sec: 10, nsec: 0 },
    message: {
      header: { seq: 0, stamp: { sec: 0, nsec: 0 }, frame_id: SENSOR_FRAME_ID },
      id: `cubeList`,
      ns: "",
      type: 6,
      action: 0,
      frame_locked: false,
      pose: {
        position: { x: 0, y: 0, z: 0 },
        orientation: { x: 0, y: 0, z: 0, w: 1 },
      },
      scale: { x: 0.25, y: 0.25, z: 0.25 },
      color: makeColor("#ffc107", 0.25),
      points: [
        { x: 0, y: 0.25, z: 0 },
        { x: 0.25, y: -0.25, z: 0 },
        { x: -0.25, y: -0.25, z: 0 },
      ],
      colors: [makeColor("#f44336", 0.5), makeColor("#4caf50", 0.5), makeColor("#2196f3", 0.5)],
      lifetime: { sec: 0, nsec: 0 },
    },
    sizeInBytes: 0,
  };

  const sphereList: MessageEvent<SphereListMarker> = {
    topic: "/markers",
    receiveTime: { sec: 10, nsec: 0 },
    message: {
      header: { seq: 0, stamp: { sec: 0, nsec: 0 }, frame_id: SENSOR_FRAME_ID },
      id: `sphereList`,
      ns: "",
      type: 7,
      action: 0,
      frame_locked: false,
      pose: {
        position: { x: 1, y: 0, z: 0 },
        orientation: { x: 0, y: 0, z: 0, w: 1 },
      },
      scale: { x: 0.25, y: 0.25, z: 0.25 },
      color: makeColor("#f44336", 0.25),
      points: [
        { x: 0, y: 0.25, z: 0 },
        { x: 0.25, y: -0.25, z: 0 },
        { x: -0.25, y: -0.25, z: 0 },
      ],
      colors: [makeColor("#f44336", 0.5), makeColor("#4caf50", 0.5), makeColor("#2196f3", 0.5)],
      lifetime: { sec: 0, nsec: 0 },
    },
    sizeInBytes: 0,
  };

  const points: MessageEvent<PointsMarker> = {
    topic: "/markers",
    receiveTime: { sec: 10, nsec: 0 },
    message: {
      header: { seq: 0, stamp: { sec: 0, nsec: 0 }, frame_id: SENSOR_FRAME_ID },
      id: `points`,
      ns: "",
      type: 8,
      action: 0,
      frame_locked: false,
      pose: {
        position: { x: -2, y: -1, z: 0 },
        orientation: { x: 0, y: 0, z: 0, w: 1 },
      },
      scale: { x: 0.25, y: 0.25, z: 0.25 },
      color: makeColor("#3f51b5", 0.25),

      points: [
        { x: 0, y: 0.25, z: 0 },
        { x: 0.25, y: -0.25, z: 0 },
        { x: -0.25, y: -0.25, z: 0 },
      ],
      colors: [makeColor("#f44336", 0.5), makeColor("#4caf50", 0.5), makeColor("#2196f3", 0.5)],
      lifetime: { sec: 0, nsec: 0 },
    },
    sizeInBytes: 0,
  };

  const text: MessageEvent<TextMarker> = {
    topic: "/markers",
    receiveTime: { sec: 10, nsec: 0 },
    message: {
      header: { seq: 0, stamp: { sec: 0, nsec: 0 }, frame_id: SENSOR_FRAME_ID },
      id: `text`,
      ns: "",
      type: 9,
      action: 0,
      frame_locked: false,
      pose: {
        position: { x: -1, y: -1, z: 0 },
        orientation: { x: 0, y: 0, z: 0, w: 1 },
      },
      scale: { x: 1, y: 1, z: 1 },
      color: makeColor("#4caf50", 0.5),
      text: "Lorem Ipsum\nDolor Sit Amet",
      lifetime: { sec: 0, nsec: 0 },
    },
    sizeInBytes: 0,
  };

  const triangleList: MessageEvent<TriangleListMarker> = {
    topic: "/markers",
    receiveTime: { sec: 10, nsec: 0 },
    message: {
      header: { seq: 0, stamp: { sec: 0, nsec: 0 }, frame_id: SENSOR_FRAME_ID },
      id: `triangleList`,
      ns: "",
      type: 11,
      action: 0,
      frame_locked: false,
      pose: {
        position: { x: 1, y: -1, z: 0 },
        orientation: { x: 0, y: 0, z: 0, w: 1 },
      },
      scale: { x: 0.5, y: 0.5, z: 0.5 },
      color: makeColor("#3f51b5", 0.5),
      points: [
        { x: 0, y: 0.25, z: 0 },
        { x: 0.25, y: -0.25, z: 0 },
        { x: -0.25, y: -0.25, z: 0 },

        { x: 0.25, y: -0.25, z: 0 },
        { x: -0.25, y: -0.25, z: 0 },
        { x: 0, y: -0.5, z: 0 },
      ],
      colors: [makeColor("#f44336", 0.5), makeColor("#4caf50", 0.5), makeColor("#2196f3", 0.5)],
      lifetime: { sec: 0, nsec: 0 },
    },
    sizeInBytes: 0,
  };

  const fixture = useDelayedFixture({
    topics,
    frame: {
      "/tf": [tf1],
      "/markers": [
        arrow,
        cube,
        sphere,
        cylinder,
        lineStrip,
        lineList,
        cubeList,
        sphereList,
        points,
        text,
        triangleList,
      ],
    },
    capabilities: [],
    activeData: {
      currentTime: { sec: 0, nsec: 0 },
    },
  });

  return (
    <PanelSetup fixture={fixture}>
      <ThreeDeeRender
        overrideConfig={{
          ...ThreeDeeRender.defaultConfig,
        }}
      />
    </PanelSetup>
  );
}

ArrowMarkers.parameters = { colorScheme: "dark" };
export function ArrowMarkers(): JSX.Element {
  const topics: Topic[] = [
    { name: "/tf", datatype: "geometry_msgs/TransformStamped" },
    { name: "/arrows", datatype: "visualization_msgs/Marker" },
  ];

  const tf1: MessageEvent<TF> = {
    topic: "/tf",
    receiveTime: { sec: 10, nsec: 0 },
    message: {
      header: { seq: 0, stamp: { sec: 0, nsec: 0 }, frame_id: FIXED_FRAME_ID },
      child_frame_id: SENSOR_FRAME_ID,
      transform: {
        translation: { x: 1e7, y: 0, z: 0 },
        rotation: QUAT_IDENTITY,
      },
    },
    sizeInBytes: 0,
  };
  const tf2: MessageEvent<TF> = {
    topic: "/tf",
    receiveTime: { sec: 10, nsec: 0 },
    message: {
      header: { seq: 0, stamp: { sec: 0, nsec: 0 }, frame_id: SENSOR_FRAME_ID },
      child_frame_id: "sensor",
      transform: {
        translation: { x: 0, y: 0, z: 1 },
        rotation: { x: 0.383, y: 0, z: 0, w: 0.924 },
      },
    },
    sizeInBytes: 0,
  };

  const arrow1: MessageEvent<ArrowMarker> = {
    topic: "/arrows",
    receiveTime: { sec: 10, nsec: 0 },
    message: {
      header: { seq: 0, stamp: { sec: 0, nsec: 0 }, frame_id: SENSOR_FRAME_ID },
      id: `arrow1`,
      ns: "",
      type: 0,
      action: 0,
      frame_locked: false,
      pose: {
        position: { x: 0.4, y: 0, z: 1 },
        orientation: QUAT_IDENTITY,
      },
      scale: { x: 0.75, y: 0.001, z: 0.25 },
      color: makeColor("#f44336", 0.5),
      lifetime: { sec: 0, nsec: 0 },
    },
    sizeInBytes: 0,
  };

  const arrow2: MessageEvent<ArrowMarker> = {
    topic: "/arrows",
    receiveTime: { sec: 10, nsec: 0 },
    message: {
      header: { seq: 0, stamp: { sec: 0, nsec: 0 }, frame_id: SENSOR_FRAME_ID },
      id: `arrow2`,
      ns: "",
      type: 0,
      action: 0,
      frame_locked: false,
      pose: {
        position: { x: 0, y: 0.3, z: 0 },
        orientation: { x: 0, y: 0, z: Math.SQRT1_2, w: Math.SQRT1_2 },
      },
      scale: { x: 0.3, y: 0.05, z: 0.05 },
      color: makeColor("#4caf50", 0.5),
      lifetime: { sec: 0, nsec: 0 },
    },
    sizeInBytes: 0,
  };

  const arrow3: MessageEvent<ArrowMarker> = {
    topic: "/arrows",
    receiveTime: { sec: 10, nsec: 0 },
    message: {
      header: { seq: 0, stamp: { sec: 0, nsec: 0 }, frame_id: SENSOR_FRAME_ID },
      id: `arrow3`,
      ns: "",
      type: 0,
      action: 0,
      frame_locked: false,
      pose: {
        position: { x: 0, y: 0, z: 0.35 },
        orientation: { x: 0, y: -Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
      },
      scale: { x: 0.05, y: 0.1, z: 0.15 },
      points: [
        { x: 0, y: 0, z: 0 },
        { x: 0.3, y: 0, z: 0 },
      ],
      color: makeColor("#2196f3", 0.5),
      lifetime: { sec: 0, nsec: 0 },
    },
    sizeInBytes: 0,
  };

  const fixture = useDelayedFixture({
    topics,
    frame: {
      "/tf": [tf1, tf2],
      "/arrows": [arrow1, arrow2, arrow3],
    },
    capabilities: [],
    activeData: {
      currentTime: { sec: 0, nsec: 0 },
    },
  });

  return (
    <PanelSetup fixture={fixture}>
      <ThreeDeeRender
        overrideConfig={{
          ...ThreeDeeRender.defaultConfig,
        }}
      />
    </PanelSetup>
  );
}
