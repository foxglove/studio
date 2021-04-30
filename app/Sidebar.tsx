// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { CommandBarButton, IIconProps, Stack, useTheme } from "@fluentui/react";
import { useState } from "react";

import { useSelectPanel } from "@foxglove-studio/app/components/AddPanelMenu";
import GlobalVariablesTable from "@foxglove-studio/app/components/GlobalVariablesTable";
import PanelList from "@foxglove-studio/app/components/PanelList";
import PanelSettings from "@foxglove-studio/app/components/PanelSettings";

const BUTTON_SIZE = 50;
const ICON_SIZE = 24;
const FADED_OPACITY = 0.7;

function AddPanel() {
  const selectPanel = useSelectPanel();
  return <PanelList onPanelSelect={selectPanel} />;
}

function Noop(): ReactNull {
  return ReactNull;
}

export default function Sidebar(): JSX.Element {
  const [selectedIndex, setSelectedIndex] = useState<number | undefined>(undefined);

  const items: {
    iconName: IIconProps["iconName"];
    title: string;
    component: React.ComponentType;
  }[] = [
    { iconName: "MediaAdd", title: "Add Panel", component: AddPanel },
    { iconName: "ColumnVerticalSectionEdit", title: "Panel Settings", component: PanelSettings },
    { iconName: "Rename", title: "Variables", component: GlobalVariablesTable },
  ];

  const SelectedComponent = (selectedIndex != undefined && items[selectedIndex]?.component) || Noop;

  const theme = useTheme();
  return (
    <Stack
      horizontal
      verticalFill
      style={{
        borderRight: `1px solid ${theme.semanticColors.bodyDivider}`,
      }}
    >
      <Stack
        style={{
          width: BUTTON_SIZE,
          flexShrink: 0,
          // borderTop: `1px solid ${theme.semanticColors.bodyDivider}`,
          borderRight: `1px solid ${theme.semanticColors.bodyDivider}`,
        }}
      >
        {items.map(({ iconName, title }, i) => {
          return (
            <Stack key={i} style={{ position: "relative" }}>
              <CommandBarButton
                title={title}
                style={{ height: BUTTON_SIZE, margin: 0 }}
                iconProps={{
                  iconName,
                  styles: {
                    root: {
                      opacity: selectedIndex === i ? 1 : FADED_OPACITY,
                      fontSize: ICON_SIZE,
                      height: ICON_SIZE,
                      lineHeight: ICON_SIZE,
                      "& span": { verticalAlign: "baseline" },
                    },
                  },
                }}
                onClick={() => setSelectedIndex((selected) => (selected === i ? undefined : i))}
              />
              {selectedIndex === i && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 3,
                    backgroundColor: theme.palette.themePrimary,
                  }}
                ></div>
              )}
            </Stack>
          );
        })}
      </Stack>
      <Stack.Item>
        <SelectedComponent />
      </Stack.Item>
    </Stack>
  );
  // return <PanelSettings />;
}
