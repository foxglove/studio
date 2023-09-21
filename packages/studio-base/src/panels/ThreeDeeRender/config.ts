// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Immutable as Im } from "immer";
import * as _ from "lodash-es";

import { Topic } from "@foxglove/studio";
import { FollowMode, ImageModeConfig } from "@foxglove/studio-base/panels/ThreeDeeRender/IRenderer";
import { MeshUpAxis } from "@foxglove/studio-base/panels/ThreeDeeRender/ModelCache";
import { CameraState } from "@foxglove/studio-base/panels/ThreeDeeRender/camera";
import { ALL_FOXGLOVE_DATATYPES } from "@foxglove/studio-base/panels/ThreeDeeRender/foxglove";
import {
  NamespacedTopic,
  namespaceTopic,
} from "@foxglove/studio-base/panels/ThreeDeeRender/namespaceTopic";
import { LayerSettingsTransform } from "@foxglove/studio-base/panels/ThreeDeeRender/renderables/FrameAxes";
import { PublishClickType } from "@foxglove/studio-base/panels/ThreeDeeRender/renderables/PublishClickTool";
import { ALL_ROS_DATATYPES } from "@foxglove/studio-base/panels/ThreeDeeRender/ros";
import {
  BaseSettings,
  CustomLayerSettings,
} from "@foxglove/studio-base/panels/ThreeDeeRender/settings";

export type RendererConfigV1 = {
  /** Camera settings for the currently rendering scene */
  cameraState: CameraState;
  /** Coordinate frameId of the rendering frame */
  followTf: string | undefined;
  /** Camera follow mode */
  followMode: FollowMode;
  scene: {
    /** Show rendering metrics in a DOM overlay */
    enableStats?: boolean;
    /** Background color override for the scene, sent to `glClearColor()` */
    backgroundColor?: string;
    /* Scale factor to apply to all labels */
    labelScaleFactor?: number;
    /** Ignore the <up_axis> tag in COLLADA files (matching rviz behavior) */
    ignoreColladaUpAxis?: boolean;
    meshUpAxis?: MeshUpAxis;
    transforms?: {
      /** Toggles translation and rotation offset controls for frames */
      editable?: boolean;
      /** Toggles visibility of frame axis labels */
      showLabel?: boolean;
      /** Size of frame axis labels */
      labelSize?: number;
      /** Size of coordinate frame axes */
      axisScale?: number;
      /** Width of the connecting line between child and parent frames */
      lineWidth?: number;
      /** Color of the connecting line between child and parent frames */
      lineColor?: string;
      /** Enable transform preloading */
      enablePreloading?: boolean;
    };
    /** Sync camera with other 3d panels */
    syncCamera?: boolean;
    /** Toggles visibility of all topics */
    topicsVisible?: boolean;
  };
  publish: {
    /** The type of message to publish when clicking in the scene */
    type: PublishClickType;
    /** The topic on which to publish poses */
    poseTopic: string;
    /** The topic on which to publish points */
    pointTopic: string;
    /** The topic on which to publish pose estimates */
    poseEstimateTopic: string;
    /** The X standard deviation to publish with poses */
    poseEstimateXDeviation: number;
    /** The Y standard deviation to publish with poses */
    poseEstimateYDeviation: number;
    /** The theta standard deviation to publish with poses */
    poseEstimateThetaDeviation: number;
  };
  /** frameId -> settings */
  transforms: Record<string, Partial<LayerSettingsTransform> | undefined>;
  /** topicName -> settings */
  topics: Record<string, Partial<BaseSettings> | undefined>;
  /** instanceId -> settings */
  layers: Record<string, Partial<CustomLayerSettings> | undefined>;

  /** Settings pertaining to Image mode */
  imageMode: ImageModeConfig;
};

// Migrated configuration with version stamp and namespaced topic nodes.
type RendererConfigV2 = RendererConfigV1 & {
  version: "2";
  /**
   * Namespaced topics, scoped by a combination of topic + schema.
   */
  namespacedTopics: Record<NamespacedTopic, undefined | Partial<BaseSettings>>;
};

export type AnyRendererConfig = RendererConfigV1 | RendererConfigV2;
export type RendererConfig = RendererConfigV2;

const ALL_SUPPORTED_SCHEMAS = new Set([
  ...ALL_ROS_DATATYPES,
  ...ALL_FOXGLOVE_DATATYPES,
  "std_msgs/String",
]);

/**
 * Migrates the old, unnamespaced `topics` nodes in a config into the new `namespacedTopics`
 * nodes. Because this depends on the topics available at the time of migration we leave
 * any nodes we couldn't migrate in `topics` in case we may be able to migrate them later.
 *
 * @param oldConfig the old configuration to migrate
 * @param topics the topics used to guide the migration
 * @returns a new config with as many nodes migrated as possible
 */
export function migrateConfigTopicsNodes(
  oldConfig: Im<RendererConfig>,
  topics: Im<Topic[]>,
): Im<RendererConfig> {
  if (topics.length === 0) {
    return oldConfig;
  }

  const unmigratedTopics: Record<string, undefined | Partial<BaseSettings>> = {};
  const newNamespacedTopics: Record<string, undefined | Partial<BaseSettings>> = {};

  for (const [key, config] of Object.entries(oldConfig.topics)) {
    const topic = topics.find((top) => top.name === key);
    if (topic) {
      if (topic.schemaName && ALL_SUPPORTED_SCHEMAS.has(topic.schemaName)) {
        const mappedKey = namespaceTopic(topic.name, topic.schemaName);
        newNamespacedTopics[mappedKey] = config;
      } else {
        const convertibleSchema = topic.convertibleTo?.find((schema) =>
          ALL_SUPPORTED_SCHEMAS.has(schema),
        );
        if (convertibleSchema) {
          const mappedKey = namespaceTopic(topic.name, convertibleSchema);
          newNamespacedTopics[mappedKey] = config;
        } else {
          unmigratedTopics[key] = config;
        }
      }
    } else {
      unmigratedTopics[key] = config;
    }
  }

  if (_.isEmpty(newNamespacedTopics)) {
    return oldConfig;
  }

  return {
    ...oldConfig,
    namespacedTopics: {
      ...oldConfig.namespacedTopics,
      ...newNamespacedTopics,
    },
    topics: unmigratedTopics,
  };
}
