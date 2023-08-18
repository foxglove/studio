// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { produce } from "immer";
import { isEqual, set } from "lodash";
import { useCallback, useEffect, useMemo } from "react";

import { Immutable, SettingsTreeAction, SettingsTreeNodes } from "@foxglove/studio";
import buildSampleMessage from "@foxglove/studio-base/panels/Publish/buildSampleMessage";
import { usePanelSettingsTreeUpdate } from "@foxglove/studio-base/providers/PanelStateContextProvider";
import { RosDatatypes } from "@foxglove/studio-base/types/RosDatatypes";
import { SaveConfig } from "@foxglove/studio-base/types/panels";

import { CallServiceConfig } from "./types";

export const defaultConfig: CallServiceConfig = {
  requestPayload: "{}",
  layout: "vertical",
  buttonText: "Call service",
};

function serviceError(serviceName?: string) {
  if (!serviceName) {
    return "Service cannot be empty";
  }
  return undefined;
}

const buildSettingsTree = (
  config: CallServiceConfig,
  schemaNames: string[],
): SettingsTreeNodes => ({
  general: {
    fields: {
      serviceName: {
        label: "Service",
        input: "string",
        error: serviceError(config.serviceName),
        value: config.serviceName ?? "",
      },
      datatype: {
        label: "Request schema",
        input: "autocomplete",
        help: "Optional request schema, used to pre-populate the request",
        items: schemaNames,
        value: config.datatype ?? "",
      },
      layout: {
        label: "Layout",
        input: "toggle",
        options: [
          { label: "vertical", value: "vertical" },
          { label: "horizontal", value: "horizontal" },
        ],
        value: config.layout ?? defaultConfig.layout,
      },
    },
  },
  button: {
    label: "Button",
    fields: {
      buttonText: { label: "Title", input: "string", value: config.buttonText },
      buttonTooltip: { label: "Tooltip", input: "string", value: config.buttonTooltip },
      buttonColor: { label: "Color", input: "rgb", value: config.buttonColor },
    },
  },
});

const getSampleMessage = (
  datatypes: Immutable<RosDatatypes>,
  datatype?: string,
): string | undefined => {
  if (datatype == undefined) {
    return undefined;
  }
  const sampleMessage = buildSampleMessage(datatypes, datatype);
  return sampleMessage != undefined ? JSON.stringify(sampleMessage, undefined, 2) : "{}";
};

export function useCallServicePanelSettings(
  config: CallServiceConfig,
  saveConfig: SaveConfig<CallServiceConfig>,
  datatypes: Immutable<RosDatatypes>,
): void {
  const updatePanelSettingsTree = usePanelSettingsTreeUpdate();
  const schemaNames = useMemo(() => Array.from(datatypes.keys()).sort(), [datatypes]);

  const actionHandler = useCallback(
    (action: SettingsTreeAction) => {
      if (action.action !== "update") {
        return;
      }
      const { path, value, input } = action.payload;

      saveConfig(
        produce<CallServiceConfig>((draft) => {
          if (input === "autocomplete") {
            if (isEqual(path, ["general", "datatype"])) {
              const sampleMessage = getSampleMessage(datatypes, value);

              draft.datatype = value;

              if (sampleMessage) {
                draft.requestPayload = sampleMessage;
              }
            }
          } else {
            set(draft, path.slice(1), value);
          }
        }),
      );
    },
    [datatypes, saveConfig],
  );

  useEffect(() => {
    updatePanelSettingsTree({
      actionHandler,
      nodes: buildSettingsTree(config, schemaNames),
    });
  }, [actionHandler, config, schemaNames, updatePanelSettingsTree]);
}
