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

import CubeOutline from "@mdi/svg/svg/cube-outline.svg";

import LaserScanVert from "@foxglove-studio/app/panels/ThreeDimensionalViz/LaserScanVert";
import sceneBuilderHooks from "@foxglove-studio/app/panels/ThreeDimensionalViz/SceneBuilder/defaultHooks";
import { defaultMapPalette } from "@foxglove-studio/app/panels/ThreeDimensionalViz/commands/utils";
import { DIAGNOSTIC_TOPIC } from "@foxglove-studio/app/util/globalConstants";

export function perPanelHooks() {
  return {
    DiagnosticSummary: {
      defaultConfig: {
        pinnedIds: [],
        hardwareIdFilter: "",
        topicToRender: DIAGNOSTIC_TOPIC,
      },
    },
    ImageView: {
      defaultConfig: {
        cameraTopic: "",
        enabledMarkerTopics: [],
        customMarkerTopicOptions: [],
        scale: 0.2,
        transformMarkers: false,
        synchronize: false,
        mode: "fit",
        zoomPercentage: 100,
        offset: [0, 0],
      },
      imageMarkerDatatypes: ["visualization_msgs/ImageMarker", "webviz_msgs/ImageMarkerArray"],
      canTransformMarkersByTopic: (topic: string) => !topic.includes("rect"),
    },
    GlobalVariableSlider: {
      getVariableSpecificOutput: () => undefined,
    },
    StateTransitions: { defaultConfig: { paths: [] }, customStateTransitionColors: {} },
    ThreeDimensionalViz: {
      defaultConfig: {
        checkedKeys: ["name:Topics"],
        expandedKeys: ["name:Topics"],
        followTf: undefined,
        cameraState: {},
        modifiedNamespaceTopics: [],
        pinTopics: false,
        settingsByKey: {},
        autoSyncCameraState: false,
        autoTextBackgroundColor: true,
      },
      MapComponent: undefined,
      topicSettingsEditors: {},
      copy: {},
      BLACKLIST_TOPICS: [] as string[],
      iconsByClassification: { DEFAULT: CubeOutline },
      allSupportedMarkers: [
        "arrow",
        "color",
        "cube",
        "cubeList",
        "cylinder",
        "filledPolygon",
        "grid",
        "instancedLineList",
        "laserScan",
        "linedConvexHull",
        "lineList",
        "lineStrip",
        "overlayIcon",
        "pointcloud",
        "points",
        "poseMarker",
        "sphere",
        "sphereList",
        "text",
        "triangleList",
      ],
      topics: [],
      // TODO(Audrey): remove icons config after topic group release
      icons: {},
      LaserScanVert,
      sceneBuilderHooks,
      getMapPalette() {
        return defaultMapPalette;
      },
      ungroupedNodesCategory: "Topics",
      rootTransformFrame: "map",
      defaultFollowTransformFrame: undefined,
      useWorldspacePointSize: () => true,
      createPointCloudPositionBuffer: () => undefined,
    },
    RawMessages: {
      docLinkFunction: (filename: string) => `https://www.google.com/search?q=${filename}`,
    },
  };
}
