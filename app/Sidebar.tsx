// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { CommandBarButton, IIconProps, Stack, useTheme } from "@fluentui/react";
import { useCallback, useState } from "react";
import { MosaicNode, MosaicWithoutDragDropContext } from "react-mosaic-component";
import styled from "styled-components";

import { useSelectPanel } from "@foxglove-studio/app/components/AddPanelMenu";
import GlobalVariablesTable from "@foxglove-studio/app/components/GlobalVariablesTable";
import variablesHelp from "@foxglove-studio/app/components/GlobalVariablesTable/index.help.md";
import PanelList from "@foxglove-studio/app/components/PanelList";
import PanelSettings from "@foxglove-studio/app/components/PanelSettings";
import { SidebarContent } from "@foxglove-studio/app/components/SidebarContent";

const BUTTON_SIZE = 50;
const ICON_SIZE = 24;
const FADED_OPACITY = 0.7;

function Noop(): ReactNull {
  return ReactNull;
}

function AddPanel() {
  const selectPanel = useSelectPanel();
  return (
    <SidebarContent title="Add panel">
      <PanelList onPanelSelect={selectPanel} />
    </SidebarContent>
  );
}

function Variables() {
  return (
    <SidebarContent title="Variables" helpContent={variablesHelp}>
      <GlobalVariablesTable />
    </SidebarContent>
  );
}

// Root drop targets in this top level sidebar mosaic interfere with drag/mouse events from the
// PanelList. We don't allow users to edit the mosaic since it's just used for the sidebar, so we
// can hide the drop targets.
const HideRootDropTargets = styled.div`
  & > .mosaic > .drop-target-container {
    display: none !important;
  }
`;

export default function Sidebar({ children }: React.PropsWithChildren<unknown>): JSX.Element {
  const [selectedIndex, setSelectedIndex] = useState<number | undefined>(undefined);
  const [mosaicValue, setMosaicValue] = useState<MosaicNode<"sidebar" | "children">>("children");

  const onSelectIndex = useCallback(
    (index: number) => {
      if (selectedIndex === index) {
        setSelectedIndex(undefined);
        setMosaicValue("children");
      } else {
        setSelectedIndex(index);
        setMosaicValue({
          direction: "row",
          first: "sidebar",
          second: "children",
          splitPercentage: 30,
        });
      }
    },
    [selectedIndex],
  );

  const items: {
    iconName: IIconProps["iconName"];
    title: string;
    component: React.ComponentType;
  }[] = [
    { iconName: "MediaAdd", title: "Add Panel", component: AddPanel },
    { iconName: "ColumnVerticalSectionEdit", title: "Panel Settings", component: PanelSettings },
    { iconName: "Rename", title: "Variables", component: Variables },
  ];

  const SelectedComponent = (selectedIndex != undefined && items[selectedIndex]?.component) || Noop;

  const theme = useTheme();
  return (
    <Stack horizontal verticalFill>
      <Stack
        style={{
          width: BUTTON_SIZE,
          flexShrink: 0,
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
                onClick={() => onSelectIndex(i)}
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
                />
              )}
            </Stack>
          );
        })}
      </Stack>
      {
        // By always rendering the mosaic, even if we are only showing children, we can prevent the
        // children from having to re-mount each time the sidebar is opened/closed.
      }
      <HideRootDropTargets style={{ flex: "1 1 100%" }}>
        <MosaicWithoutDragDropContext<"sidebar" | "children">
          className=""
          value={mosaicValue}
          onChange={(value) => value != undefined && setMosaicValue(value)}
          renderTile={(id) =>
            id === "children" ? (children as JSX.Element) : <SelectedComponent />
          }
          resize={{ minimumPaneSizePercentage: 30 }}
        />
      </HideRootDropTargets>
    </Stack>
  );
}
