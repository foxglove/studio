// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { produce } from "immer";
import { isEqual, set } from "lodash";
import { useCallback, useEffect } from "react";

import { Immutable, SettingsTreeAction, SettingsTreeNodes } from "@foxglove/studio";
import buildSampleMessage from "@foxglove/studio-base/panels/Publish/buildSampleMessage";
import { Topic } from "@foxglove/studio-base/players/types";
import { usePanelSettingsTreeUpdate } from "@foxglove/studio-base/providers/PanelStateContextProvider";
import { RosDatatypes } from "@foxglove/studio-base/types/RosDatatypes";
import { SaveConfig } from "@foxglove/studio-base/types/panels";

import { PublishConfig } from "./types";

export function buildSettingsTree(
  config: PublishConfig,
  schemaNames: string[],
  topics: readonly Topic[],
): SettingsTreeNodes {
  return {
    general: {
      fields: {
        topicName: {
          label: "Topic",
          input: "autocomplete",
          placeholder: "Choose a topic…",
          value: config.topicName,
          items: topics.map((t) => t.name),
        },
        datatype: {
          label: "Message schema",
          input: "autocomplete",
          placeholder: "Choose a message schema…",
          items: schemaNames,
          value: config.datatype,
        },
        advancedView: { label: "Editing mode", input: "boolean", value: config.advancedView },
      },
    },
    styles: {
      label: "Styling",
      fields: {
        buttonText: { label: "Button title", input: "string", value: config.buttonText },
        buttonTooltip: { label: "Button tooltip", input: "string", value: config.buttonTooltip },
        buttonColor: { label: "Button color", input: "rgb", value: config.buttonColor },
      },
    },
  };
}

export function usePublishPanelSettings(
  config: PublishConfig,
  saveConfig: SaveConfig<PublishConfig>,
  schemaNames: string[],
  topics: readonly Topic[],
  datatypes: Immutable<RosDatatypes>,
): void {
  const updatePanelSettingsTree = usePanelSettingsTreeUpdate();

  const actionHandler = useCallback(
    (action: SettingsTreeAction) => {
      if (action.action === "update") {
        const { path, value, input } = action.payload;

        saveConfig(
          produce<PublishConfig>((draft) => {
            if (input === "autocomplete" && isEqual(path, ["general", "topicName"])) {
              const topicSchemaName = topics.find((t) => t.name === value)?.schemaName;

              draft.topicName = value;
              if (draft.datatype == undefined || draft.datatype === "") {
                draft.datatype = topicSchemaName;
              }
            } else if (input === "autocomplete" && isEqual(path, ["general", "datatype"])) {
              draft.datatype = value;

              if (config.datatype != undefined) {
                const sampleMessage = buildSampleMessage(datatypes, config.datatype);

                if (sampleMessage != undefined) {
                  const stringifiedSampleMessage = JSON.stringify(sampleMessage, undefined, 2);
                  draft.value = stringifiedSampleMessage;
                }
              }
            } else {
              set(draft, path.slice(1), value);
            }
          }),
        );
      }
    },
    [config, datatypes, saveConfig, topics],
  );

  useEffect(() => {
    updatePanelSettingsTree({
      actionHandler,
      nodes: buildSettingsTree(config, schemaNames, topics),
    });
  }, [actionHandler, config, schemaNames, topics, updatePanelSettingsTree]);
}
