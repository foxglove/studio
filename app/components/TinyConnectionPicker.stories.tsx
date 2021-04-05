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

import {
  ContextualMenu,
  ContextualMenuItem,
  IContextualMenuItemProps,
  IRenderFunction,
} from "@fluentui/react";
import { useRef } from "react";

import MockMessagePipelineProvider from "@foxglove-studio/app/components/MessagePipeline/MockMessagePipelineProvider";
import TinyConnectionPicker from "@foxglove-studio/app/components/TinyConnectionPicker";
import PlayerSelectionContext, {
  PlayerSelection,
  PlayerSourceDefinition,
} from "@foxglove-studio/app/context/PlayerSelectionContext";

export default {
  title: "<TinyConnectionPicker>",
  component: TinyConnectionPicker,
  parameters: {
    chromatic: {
      delay: 5000,
    },
  },
};

export function Default(): React.ReactElement {
  const playerSources: PlayerSourceDefinition[] = [
    {
      name: "Bag File",
      type: "file",
    },
    {
      name: "ROS",
      type: "ros1-core",
    },
    {
      name: "Websocket",
      type: "ws",
    },
    {
      name: "HTTP",
      type: "http",
    },
  ];

  const value: PlayerSelection = {
    selectSource: () => {},
    setPlayerFromDemoBag: async () => {},
    availableSources: playerSources,
  };

  const ref = useRef<HTMLDivElement | ReactNull>(ReactNull);

  return (
    <PlayerSelectionContext.Provider value={value}>
      <MockMessagePipelineProvider>
        <div style={{ padding: 8, width: "100%", height: 400 }}>
          <TinyConnectionPicker defaultIsOpen />
          <div ref={ref} style={{ position: "absolute", left: 200 }}>
            <ContextualMenu
              doNotLayer={true}
              target={new MouseEvent("click", { clientX: 200, clientY: 0 })}
              hidden={false}
              items={playerSources.map((source) => {
                let iconName: string;
                switch (source.type) {
                  case "file":
                    iconName = "OpenFile";
                    break;
                  case "ros1-core":
                    iconName = "studio.ROS";
                    break;
                  case "ws":
                    iconName = "Flow";
                    break;
                  case "http":
                    iconName = "FileASPX";
                    break;
                }
                return {
                  key: source.name,
                  text: source.name,
                  onClick: () => void 0,
                  iconProps: { iconName },
                };
              })}
            />
          </div>
          <div style={{ position: "absolute", left: 400 }}>
            {playerSources.map((source, i) => {
              let iconName: string;
              switch (source.type) {
                case "file":
                  iconName = "OpenFile";
                  break;
                case "ros1-core":
                  iconName = "studio.ROS";
                  break;
                case "ws":
                  iconName = "Flow";
                  break;
                case "http":
                  iconName = "FileASPX";
                  break;
              }
              const item = {
                key: source.name,
                text: source.name,
                onClick: () => void 0,
                iconProps: { iconName },
              };
              return (
                <ContextualMenuItem
                  key={source.type}
                  index={i}
                  hasIcons={true}
                  classNames={{
                    item: "",
                    divider: "",
                    root: "",
                    linkContent: "",
                    icon: "",
                    checkmarkIcon: "",
                    subMenuIcon: "",
                    label: "",
                    secondaryText: "",
                    splitContainer: "",
                    splitPrimary: "",
                    splitMenu: "",
                    linkContentMenu: "",
                    screenReaderText: "",
                  }}
                  item={item}
                />
              );
            })}
          </div>
        </div>
      </MockMessagePipelineProvider>
    </PlayerSelectionContext.Provider>
  );
}
