// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  CommandBarButton,
  IContextualMenuProps,
  IIconProps,
  IOverflowSetItemProps,
  makeStyles,
  OverflowSet,
  ResizeGroup,
  ResizeGroupDirection,
  Stack,
  useTheme,
} from "@fluentui/react";
import { useCallback, useState } from "react";
import { MosaicNode, MosaicWithoutDragDropContext } from "react-mosaic-component";
import styled from "styled-components";

import { useSelectPanel } from "@foxglove-studio/app/components/AddPanelMenu";
import GlobalVariablesTable from "@foxglove-studio/app/components/GlobalVariablesTable";
import variablesHelp from "@foxglove-studio/app/components/GlobalVariablesTable/index.help.md";
import PanelList from "@foxglove-studio/app/components/PanelList";
import { SidebarContent } from "@foxglove-studio/app/components/SidebarContent";
import filterMap from "@foxglove-studio/app/util/filterMap";

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

type SidebarItem = {
  iconName: IIconProps["iconName"];
  title: string;
  component: React.ComponentType;
};

function Preferences() {
  return <SidebarContent title="Preferences"></SidebarContent>;
}

const SIDEBAR_ITEMS = new Map<string, SidebarItem>([
  ["add-panel", { iconName: "MediaAdd", title: "Add Panel", component: AddPanel }],
  ["variables", { iconName: "Rename", title: "Variables", component: Variables }],
  ["variablesa", { iconName: "Rename", title: "Variables", component: Variables }],
  ["variablesb", { iconName: "Rename", title: "Variables", component: Variables }],
  ["variablesc", { iconName: "Rename", title: "Variables", component: Variables }],
  ["variablesd", { iconName: "Rename", title: "Variables", component: Variables }],
  ["variablese", { iconName: "Rename", title: "Variables", component: Variables }],
  ["preferences", { iconName: "Settings", title: "Preferences", component: Preferences }],
]);

const SIDEBAR_BOTTOM_ITEMS: readonly string[] = ["preferences"];

const useStyles = makeStyles({
  resizeGroup: {
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    "> div, > div > div": {
      display: "flex",
      flexDirection: "column",
      flexGrow: 1,
    },
  },
});

function SidebarButton({
  selected,
  title,
  iconProps,
  onClick,
  menuProps,
  menuIconProps,
}: {
  selected: boolean;
  title: string;
  iconProps?: IIconProps;
  onClick?: () => void;
  menuProps?: IContextualMenuProps;
  menuIconProps?: IIconProps;
}) {
  const theme = useTheme();
  return (
    <Stack style={{ position: "relative", flexGrow: 1 }}>
      <CommandBarButton
        title={title}
        style={{ height: BUTTON_SIZE, margin: 0 }}
        iconProps={{
          styles: {
            root: {
              opacity: selected ? 1 : FADED_OPACITY,
              fontSize: ICON_SIZE,
              height: ICON_SIZE,
              lineHeight: ICON_SIZE,
              "& span": { verticalAlign: "baseline" },
            },
          },
          ...iconProps,
        }}
        onClick={onClick}
        menuProps={menuProps}
        menuIconProps={menuIconProps}
      />
      {selected && (
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
}

export default function Sidebar({ children }: React.PropsWithChildren<unknown>): JSX.Element {
  const [selectedKey, setSelectedKey] = useState<string | undefined>();
  const [mosaicValue, setMosaicValue] = useState<MosaicNode<"sidebar" | "children">>("children");

  const theme = useTheme();
  const classNames = useStyles();

  const onSelectKey = useCallback(
    (key: string) => {
      if (selectedKey === key) {
        setSelectedKey(undefined);
        setMosaicValue("children");
      } else {
        setSelectedKey(key);
        setMosaicValue({
          direction: "row",
          first: "sidebar",
          second: "children",
          splitPercentage: 30,
        });
      }
    },
    [selectedKey],
  );

  const SelectedComponent =
    (selectedKey != undefined && SIDEBAR_ITEMS.get(selectedKey)?.component) || Noop;

  // Callbacks for OverflowSet
  const onRenderItem = useCallback(
    ({ key }: IOverflowSetItemProps) => {
      const item = SIDEBAR_ITEMS.get(key);
      if (!item) {
        throw new Error(`Missing sidebar item ${key}`);
      }
      const { title, iconName } = item;
      return (
        <SidebarButton
          key={key}
          selected={selectedKey === key}
          title={title}
          iconProps={{ iconName }}
          onClick={() => onSelectKey(key)}
        />
      );
    },
    [onSelectKey, selectedKey],
  );
  const onRenderOverflowButton = useCallback(
    (overflowItems?: IOverflowSetItemProps[]) => {
      if (!overflowItems) {
        return ReactNull;
      }
      const overflowItemSelected = overflowItems.some(({ key }) => selectedKey === key);
      return (
        <SidebarButton
          selected={overflowItemSelected}
          title="More"
          menuIconProps={{ iconName: "MoreVertical" }}
          menuProps={{
            items: overflowItems.map(({ key }) => {
              const item = SIDEBAR_ITEMS.get(key);
              if (!item) {
                throw new Error(`Missing sidebar item ${key}`);
              }
              return {
                key,
                checked: selectedKey === key,
                canCheck: overflowItemSelected,
                text: item.title,
                iconProps: { iconName: item.iconName },
                onClick: () => setSelectedKey(key),
              };
            }),
          }}
        />
      );
    },
    [selectedKey],
  );

  // Data and callbacks for ResizeGroup
  type Data = { itemsToShow: number };
  const onRenderData = useCallback(
    ({ itemsToShow }: Data) => {
      const shownItems = filterMap(SIDEBAR_ITEMS.keys(), (key) =>
        SIDEBAR_BOTTOM_ITEMS.includes(key) ? undefined : { key },
      );
      const overflowItems = shownItems.splice(itemsToShow);

      return (
        <Stack
          style={{
            width: BUTTON_SIZE,
            flexShrink: 0,
            flexGrow: 1,
            borderRight: `1px solid ${theme.semanticColors.bodyDivider}`,
          }}
        >
          <OverflowSet
            vertical
            items={shownItems}
            overflowItems={overflowItems}
            onRenderItem={onRenderItem}
            onRenderOverflowButton={onRenderOverflowButton}
          />
          <div style={{ flexGrow: 1 }} />
          <Stack
          // mimic the OverflowSet item's display:flex
          >
            {SIDEBAR_BOTTOM_ITEMS.map((key) => onRenderItem({ key }))}
          </Stack>
        </Stack>
      );
    },
    [onRenderItem, onRenderOverflowButton, theme],
  );
  const onReduceData = useCallback(
    ({ itemsToShow }: Data) => (itemsToShow === 0 ? undefined : { itemsToShow: itemsToShow - 1 }),
    [],
  );

  return (
    <Stack horizontal verticalFill style={{ overflow: "hidden" }}>
      <ResizeGroup
        className={classNames.resizeGroup}
        direction={ResizeGroupDirection.vertical}
        data={{ itemsToShow: SIDEBAR_ITEMS.size - SIDEBAR_BOTTOM_ITEMS.length }}
        onRenderData={onRenderData}
        onReduceData={onReduceData}
      />
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
