// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
import { PanelsState } from "@foxglove-studio/app/reducers/panels";

const state: PanelsState = {
  layout: {
    first: {
      first: "StateTransitions!3485dnq",
      second: "DiagnosticStatusPanel!1m51jv5",
      direction: "row",
    },
    second: "3D Panel!3vhcz8n",
    direction: "row",
  },
  savedProps: {
    "StateTransitions!3485dnq": {
      paths: [
        {
          value: "/radar/points.height",
          timestampMethod: "receiveTime",
        },
      ],
    },
    "3D Panel!3vhcz8n": {
      checkedKeys: ["name:Topics", "t:/radar/points"],
      expandedKeys: ["name:Topics"],
      followTf: "radar",
      cameraState: {
        targetOffset: [0, 0, 0],
      },
      modifiedNamespaceTopics: [],
      pinTopics: false,
      settingsByKey: {},
      autoSyncCameraState: false,
      autoTextBackgroundColor: true,
      followOrientation: false,
    },
  },
  globalVariables: {},
  userNodes: {},
  linkedGlobalVariables: [],
  playbackConfig: {
    speed: 1,
    messageOrder: "receiveTime",
    timeDisplayMethod: "ROS",
  },
};
export default state;
