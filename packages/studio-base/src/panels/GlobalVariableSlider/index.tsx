// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
//
// This file incorporates work covered by the following copyright and
// permission notice:
//
//   Copyright 2019-2021 Cruise LLC
//
//   This source code is licensed under the Apache License, Version 2.0,
//   found at http://www.apache.org/licenses/LICENSE-2.0
//   You may not use this file except in compliance with the License.

import { Slider } from "@fluentui/react";
import { useTheme } from "@mui/material";
import produce from "immer";
import { set } from "lodash";
import { useCallback, useContext, useEffect } from "react";

import Panel from "@foxglove/studio-base/components/Panel";
import { usePanelContext } from "@foxglove/studio-base/components/PanelContext";
import PanelToolbar from "@foxglove/studio-base/components/PanelToolbar";
import {
  SettingsTreeAction,
  SettingsTreeNode,
} from "@foxglove/studio-base/components/SettingsTreeEditor/types";
import { PanelSettingsEditorContext } from "@foxglove/studio-base/context/PanelSettingsEditorContext";
import useGlobalVariables from "@foxglove/studio-base/hooks/useGlobalVariables";

import helpContent from "./index.help.md";

type SliderProps = {
  min: number;
  max: number;
  step: number;
};

export type GlobalVariableSliderConfig = {
  sliderProps: SliderProps;
  globalVariableName: string;
};

function buildSettingsTree(config: GlobalVariableSliderConfig): SettingsTreeNode {
  return {
    fields: {
      min: { label: "Min", input: "number", value: config.sliderProps.min },
      max: { label: "Max", input: "number", value: config.sliderProps.max },
      step: { label: "Step", input: "number", value: config.sliderProps.step },
      globalVariableName: {
        label: "Global Variable Name",
        input: "string",
        value: config.globalVariableName,
      },
    },
  };
}

type Props = {
  config: GlobalVariableSliderConfig;
};

function GlobalVariableSliderPanel(props: Props): React.ReactElement {
  const { sliderProps, globalVariableName } = props.config;
  const { globalVariables, setGlobalVariables } = useGlobalVariables();

  const globalVariableValue = globalVariables[globalVariableName];

  const { id: panelId, saveConfig } = usePanelContext();
  const { updatePanelSettingsTree } = useContext(PanelSettingsEditorContext);

  const theme = useTheme();

  const actionHandler = useCallback(
    (action: SettingsTreeAction) => {
      saveConfig(
        produce(props.config, (draft) => {
          if (["min", "max"].includes(action.payload.path[0] ?? "")) {
            set(draft, ["sliderProps", ...action.payload.path], action.payload.value);
          } else if (
            action.payload.path[0] === "step" &&
            action.payload.input === "number" &&
            action.payload.value != undefined &&
            action.payload.value > 0
          ) {
            set(draft, ["sliderProps", "step"], action.payload.value);
          } else {
            set(draft, action.payload.path, action.payload.value);
          }
        }),
      );
    },
    [props.config, saveConfig],
  );

  useEffect(() => {
    updatePanelSettingsTree(panelId, {
      actionHandler,
      disableFilter: true,
      settings: buildSettingsTree(props.config),
    });
  }, [actionHandler, panelId, props.config, updatePanelSettingsTree]);

  const sliderOnChange = (value: number) => {
    if (value !== globalVariableValue) {
      setGlobalVariables({ [globalVariableName]: value });
    }
  };

  return (
    <div style={{ padding: theme.spacing(2, 0.5) }}>
      <PanelToolbar helpContent={helpContent} floating />
      <Slider
        min={sliderProps.min}
        max={sliderProps.max}
        step={sliderProps.step}
        showValue
        snapToStep
        value={typeof globalVariableValue === "number" ? globalVariableValue : 0}
        onChange={sliderOnChange}
        styles={{
          // render min/max labels under the slider
          slideBox: {
            "::after": {
              position: "absolute",
              bottom: "-60%",
              left: 0,
              paddingLeft: "8px",
              fontSize: "0.75em",
              width: "100%",
              mixBlendMode: "difference",
              content: `'${sliderProps.min}'`,
            },
            "::before": {
              position: "absolute",
              bottom: "-60%",
              left: 0,
              fontSize: "0.75em",
              paddingRight: "8px",
              textAlign: "right",
              width: "100%",
              mixBlendMode: "difference",
              content: `'${sliderProps.max}'`,
            },
          },
        }}
      />
    </div>
  );
}

export default Panel(
  Object.assign(GlobalVariableSliderPanel, {
    panelType: "GlobalVariableSliderPanel",
    defaultConfig: {
      sliderProps: { min: 0, max: 10, step: 1 },
      globalVariableName: "globalVariable",
    },
  }),
);
