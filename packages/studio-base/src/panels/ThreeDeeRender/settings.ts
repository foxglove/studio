// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { memoize } from "lodash";

import { CameraState, DEFAULT_CAMERA_STATE } from "@foxglove/regl-worldview";
import { Topic } from "@foxglove/studio";
import {
  SettingsTreeChildren,
  SettingsTreeFields,
  SettingsTreeNode,
} from "@foxglove/studio-base/components/SettingsTreeEditor/types";

import {
  MARKER_ARRAY_DATATYPES,
  MARKER_DATATYPES,
  OCCUPANCY_GRID_DATATYPES,
  POINTCLOUD_DATATYPES,
  TF_DATATYPES,
  TRANSFORM_STAMPED_DATATYPES,
} from "./ros";

export type ThreeDeeRenderConfig = {
  cameraState: CameraState;
  enableStats: boolean;
  followTf?: string;
  topics: Record<string, unknown>;
};

export type SelectEntry = { label: string; value: string };

export type TopicSettingsMarker = {
  color: string | undefined;
};

export type TopicSettingsOccupancyGrid = {
  frameLock: boolean;
};

export type TopicSettingsPointCloud2 = {
  pointSize: number;
  pointShape: "circle" | "square";
  decayTime: number;
  colorBy: string | undefined;
  flatColor: string | undefined;
  valueMin: number | undefined;
  valueMax: number | undefined;
  colorMap: "turbo" | "rainbow" | "gradient";
  gradient: [string, string] | undefined;
};

export const SUPPORTED_DATATYPES = new Set<string>();
mergeSetInto(SUPPORTED_DATATYPES, TRANSFORM_STAMPED_DATATYPES);
mergeSetInto(SUPPORTED_DATATYPES, TF_DATATYPES);
mergeSetInto(SUPPORTED_DATATYPES, MARKER_DATATYPES);
mergeSetInto(SUPPORTED_DATATYPES, MARKER_ARRAY_DATATYPES);
mergeSetInto(SUPPORTED_DATATYPES, OCCUPANCY_GRID_DATATYPES);
mergeSetInto(SUPPORTED_DATATYPES, POINTCLOUD_DATATYPES);

const ONE_DEGREE = Math.PI / 180;

const POINT_SHAPE_OPTIONS = [
  { label: "Circle", value: "circle" },
  { label: "Square", value: "square" },
];
const POINTCLOUD_REQUIRED_FIELDS = ["x", "y", "z"];
const COLOR_FIELDS = new Set<string>(["rgb", "rgba", "bgr", "bgra", "abgr", "color"]);
const INTENSITY_FIELDS = new Set<string>(["intensity", "i"]);

export type SettingsTreeOptions = {
  config: ThreeDeeRenderConfig;
  coordinateFrames: ReadonlyArray<SelectEntry>;
  followTf: string | undefined;
  topics: ReadonlyArray<Topic>;
  pclFieldsByTopic: Map<string, string[]>;
};

function buildTopicNode(
  topicConfigOrTopicName: unknown,
  topic: Topic,
  pclFieldsByTopic: Map<string, string[]>,
): undefined | SettingsTreeNode {
  const { datatype } = topic;
  if (
    !SUPPORTED_DATATYPES.has(datatype) ||
    TF_DATATYPES.has(datatype) ||
    TF_DATATYPES.has(datatype)
  ) {
    return;
  }

  type SettingsTreeNodeWithFields = SettingsTreeNode & { fields: SettingsTreeFields };
  const node: SettingsTreeNodeWithFields = { label: topic.name, fields: {} };
  const topicConfig = typeof topicConfigOrTopicName === "string" ? {} : topicConfigOrTopicName;

  if (MARKER_DATATYPES.has(datatype) || MARKER_ARRAY_DATATYPES.has(datatype)) {
    const cur = topicConfig as Partial<TopicSettingsMarker> | undefined;
    const color = cur?.color;
    node.fields.color = { label: "Color", input: "color", value: color };
  } else if (OCCUPANCY_GRID_DATATYPES.has(datatype)) {
    const cur = topicConfig as Partial<TopicSettingsOccupancyGrid> | undefined;
    const frameLock = cur?.frameLock ?? false;
    node.fields.frameLock = { label: "Frame lock", input: "boolean", value: frameLock };
  } else if (POINTCLOUD_DATATYPES.has(datatype)) {
    const cur = topicConfig as Partial<TopicSettingsPointCloud2> | undefined;
    const pclFields = pclFieldsByTopic.get(topic.name) ?? POINTCLOUD_REQUIRED_FIELDS;
    const pointSize = cur?.pointSize;
    const pointShape = cur?.pointShape ?? "circle";
    const decayTime = cur?.decayTime;
    const colorBy = cur?.colorBy ?? bestColorByField(pclFields);
    const colorByOptions = pclFields.map((field) => ({ label: field, value: field }));
    const flatColor = cur?.flatColor ?? "#ffffff";
    const valueMin = cur?.valueMin;
    const valueMax = cur?.valueMax;
    const colorMap = cur?.colorMap ?? "turbo";
    // const gradient = cur?.gradient;

    node.fields.pointSize = {
      label: "Point size",
      input: "number",
      value: pointSize,
      placeholder: "2",
    };
    node.fields.pointShape = {
      label: "Point shape",
      input: "select",
      options: POINT_SHAPE_OPTIONS,
      value: pointShape,
    };
    node.fields.decayTime = {
      label: "Decay time",
      input: "number",
      value: decayTime,
      step: 0.5,
      placeholder: "0 seconds",
    };
    node.fields.colorBy = {
      label: "Color by",
      input: "select",
      options: [{ label: "None", value: "none" }].concat(colorByOptions),
      value: colorBy,
    };
    if (!colorBy || colorBy === "none") {
      node.fields.flatColor = { label: "Flat color", input: "color", value: flatColor };
    } else {
      node.fields.valueMin = {
        label: "Value min",
        input: "number",
        value: valueMin,
        placeholder: "auto",
      };
      node.fields.valueMax = {
        label: "Value max",
        input: "number",
        value: valueMax,
        placeholder: "auto",
      };
      node.fields.colorMap = {
        label: "Color map",
        input: "select",
        options: [
          { label: "Turbo", value: "turbo" },
          { label: "Rainbow", value: "rainbow" },
          { label: "Gradient", value: "gradient" },
        ],
        value: colorMap,
      };
      if (colorMap === "gradient") {
        // node.fields.gradient = { label: "Gradient", input: "gradient", value: gradient };
      }
    }
  }

  return node;
}

const memoBuildTopicNode = memoize(buildTopicNode);

export function buildSettingsTree(options: SettingsTreeOptions): SettingsTreeNode {
  const { config, coordinateFrames, followTf, topics, pclFieldsByTopic } = options;
  const { cameraState } = config;

  const topicsChildren: SettingsTreeChildren = {};

  const sortedTopics = sorted(topics, (a, b) => a.name.localeCompare(b.name));
  for (const topic of sortedTopics) {
    // We key our memoized function by the first argument. Since the config
    // maybe be undefined we use the config or the topic name.
    const topicConfig = config.topics[topic.name] ?? topic.name;
    const newNode = memoBuildTopicNode(topicConfig, topic, pclFieldsByTopic);
    if (newNode) {
      topicsChildren[topic.name] = newNode;
    }
  }

  // prettier-ignore
  return {
    fields: {
      followTf: { label: "Coordinate Frame", input: "select", options: coordinateFrames, value: followTf },
      enableStats: { label: "Enable Stats", input: "boolean", value: config.enableStats },
    },
    children: {
      cameraState: {
        label: "Camera",
        fields: {
          distance: { label: "Distance", input: "number", value: cameraState.distance, step: 1 },
          perspective: { label: "Perspective", input: "boolean", value: cameraState.perspective },
          targetOffset: { label: "Target", input: "vec3", labels: ["X", "Y", "Z"], value: cameraState.targetOffset },
          thetaOffset: { label: "Theta", input: "number", value: cameraState.thetaOffset, step: ONE_DEGREE },
          phi: { label: "Phi", input: "number", value: cameraState.phi, step: ONE_DEGREE },
          fovy: { label: "Y-Axis FOV", input: "number", value: cameraState.fovy, step: ONE_DEGREE },
          near: { label: "Near", input: "number", value: cameraState.near, step: DEFAULT_CAMERA_STATE.near },
          far: { label: "Far", input: "number", value: cameraState.far, step: 1 },
        },
      },
      topics: {
        label: "Topics",
        children: topicsChildren,
      },
    },
  };
}

function mergeSetInto(output: Set<string>, input: ReadonlySet<string>) {
  for (const value of input) {
    output.add(value);
  }
}

function sorted<T>(array: ReadonlyArray<T>, compare: (a: T, b: T) => number): Array<T> {
  return array.slice().sort(compare);
}

function bestColorByField(pclFields: string[]): string {
  for (const field of pclFields) {
    if (COLOR_FIELDS.has(field)) {
      return field;
    }
  }
  for (const field of pclFields) {
    if (INTENSITY_FIELDS.has(field)) {
      return field;
    }
  }
  return "none";
}
