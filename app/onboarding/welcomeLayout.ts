// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
import { PanelsState } from "@foxglove-studio/app/reducers/panels";

export const DEMO_BAG_URL = "https://open-source-webviz-ui.s3.amazonaws.com/demo.bag";

const state: PanelsState = {
  layout: {
    first: {
      first: {
        first: "Plot!2srxf7j",
        second: {
          first: "StateTransitions!3v5kkkn",
          second: "3D Panel!3vhcz8n",
          direction: "column",
          splitPercentage: 29.709659628112195,
        },
        direction: "column",
        splitPercentage: 22.05128205128205,
      },
      second: {
        first: "ImageViewPanel!4evmpi6",
        second: {
          first: "DiagnosticSummary!2ttktu0",
          second: "DiagnosticStatusPanel!2yh7rts",
          direction: "column",
          splitPercentage: 35.6573705179283,
        },
        direction: "column",
        splitPercentage: 25.748502994011975,
      },
      direction: "row",
      splitPercentage: 52.86975717439294,
    },
    second: "onboarding.welcome!31b1ehz",
    direction: "row",
    splitPercentage: 66.03498542274052,
  },
  savedProps: {
    "Plot!2srxf7j": {
      paths: [
        {
          value: "/radar/tracks.tracks[:]{number==$track_id}.accel",
          enabled: true,
          timestampMethod: "receiveTime",
        },
        {
          value: "/radar/tracks.tracks[:]{number==$track_id}.rate",
          enabled: true,
          timestampMethod: "receiveTime",
        },
      ],
      minYValue: "",
      maxYValue: "",
      showLegend: false,
      xAxisVal: "timestamp",
    },
    "StateTransitions!3v5kkkn": {
      paths: [
        {
          value: "/radar/tracks.tracks[:]{number==$track_id}.moving",
          timestampMethod: "receiveTime",
        },
        {
          value: "/radar/tracks.tracks[:]{number==$track_id}.status",
          timestampMethod: "receiveTime",
        },
      ],
    },
    "3D Panel!3vhcz8n": {
      checkedKeys: ["name:Topics", "t:/velodyne_points", "t:/radar/points"],
      expandedKeys: ["name:Topics", "t:/tf"],
      followTf: "velodyne",
      cameraState: {
        targetOffset: [0, 0, 0],
        thetaOffset: 1.6227449919298258,
        distance: 51.57407475453429,
        perspective: true,
        phi: 1.044534412955465,
        fovy: 0.7853981633974483,
        near: 0.01,
        far: 5000,
      },
      modifiedNamespaceTopics: [],
      pinTopics: false,
      settingsByKey: {
        "t:/velodyne_points": {
          colorMode: {
            mode: "rainbow",
            colorField: "intensity",
          },
          pointShape: "circle",
          pointSize: 2,
        },
      },
      autoSyncCameraState: false,
      autoTextBackgroundColor: true,
    },
    "ImageViewPanel!4evmpi6": {
      cameraTopic: "/image_raw",
      enabledMarkerTopics: [],
      customMarkerTopicOptions: [],
      scale: 0.2,
      transformMarkers: true,
      synchronize: false,
      mode: "other",
      zoomPercentage: 27.500000000000004,
      offset: [0, 0],
    },
    "DiagnosticStatusPanel!2yh7rts": {
      topicToRender: "/diagnostics",
      collapsedSections: [],
      selectedHardwareId: "Velodyne HDL-32E",
      splitFraction: 0.7048054919908466,
      selectedName: "velodyne_nodelet_manager: velodyne_packets topic status",
    },
  },
  globalVariables: {
    track_id: 25,
  },
  userNodes: {},
  linkedGlobalVariables: [],
  playbackConfig: {
    speed: 1,
    messageOrder: "receiveTime",
    timeDisplayMethod: "ROS",
  },
};
export default state;
