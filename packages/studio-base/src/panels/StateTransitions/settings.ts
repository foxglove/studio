// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import memoizeWeak from "memoize-weak";
import { useCallback, useEffect } from "react";

import { SettingsTreeAction, SettingsTreeNode, SettingsTreeNodes } from "@foxglove/studio";
import { plotableRosTypes } from "@foxglove/studio-base/panels/Plot";
import { usePanelSettingsTreeUpdate } from "@foxglove/studio-base/providers/PanelStateContextProvider";
import { SaveConfig } from "@foxglove/studio-base/types/panels";
import { lineColors } from "@foxglove/studio-base/util/plotColors";

import {
  StateTransitionConfig,
  StateTransitionPath,
  stateTransitionPathDisplayName,
} from "./types";

const makeSeriesNode = memoizeWeak((path: StateTransitionPath, index: number): SettingsTreeNode => {
  return {
    actions: [
      {
        type: "action",
        id: "delete-series",
        label: "Delete series",
        display: "inline",
        icon: "Clear",
      },
    ],
    label: stateTransitionPathDisplayName(path, index),
    visible: path.enabled,
    fields: {
      value: {
        label: "Message path",
        input: "messagepath",
        value: path.value,
        validTypes: plotableRosTypes,
      },
      label: {
        input: "string",
        label: "Label",
        value: path.label,
      },
      color: {
        input: "rgb",
        label: "Color",
        value: path.color ?? lineColors[index % lineColors.length],
      },
      timestampMethod: {
        input: "select",
        label: "Timestamp",
        value: path.timestampMethod,
        options: [
          { label: "Receive Time", value: "receiveTime" },
          { label: "Header Stamp", value: "headerStamp" },
        ],
      },
    },
  };
});

const makeRootSeriesNode = memoizeWeak((paths: StateTransitionPath[]): SettingsTreeNode => {
  const children = Object.fromEntries(
    paths.map((path, index) => [`${index}`, makeSeriesNode(path, index)]),
  );
  return {
    label: "Series",
    children,
    actions: [
      {
        type: "action",
        id: "add-series",
        label: "Add series",
        display: "inline",
        icon: "Addchart",
      },
    ],
  };
});

function buildSettingsTree(config: StateTransitionConfig): SettingsTreeNodes {
  return {
    general: {
      label: "General",
      fields: {
        isSynced: { label: "Sync with other plots", input: "boolean", value: config.isSynced },
      },
    },
    paths: makeRootSeriesNode(config.paths),
  };
}

export function useStateTransitionsPanelSettings(
  config: StateTransitionConfig,
  saveConfig: SaveConfig<StateTransitionConfig>,
): void {
  const updatePanelSettingsTree = usePanelSettingsTreeUpdate();

  const actionHandler = useCallback(
    (action: SettingsTreeAction) => {
      if (action.action !== "update") {
        return;
      } else if (
        action.payload.input === "boolean" &&
        action.payload.path[0] === "general" &&
        action.payload.path[1] === "isSynced"
      ) {
        saveConfig({ isSynced: action.payload.value });
      }
    },
    [saveConfig],
  );

  useEffect(() => {
    updatePanelSettingsTree({
      actionHandler,
      nodes: buildSettingsTree(config),
    });
  }, [actionHandler, config, updatePanelSettingsTree]);
}
