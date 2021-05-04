// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  CommandBarButton,
  DirectionalHint,
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
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { MosaicNode, MosaicWithoutDragDropContext } from "react-mosaic-component";
import styled from "styled-components";

import filterMap from "@foxglove-studio/app/util/filterMap";

const BUTTON_SIZE = 50;
const ICON_SIZE = 24;
const FADED_OPACITY = 0.7;

function Noop(): ReactNull {
  return ReactNull;
}

// Root drop targets in this top level sidebar mosaic interfere with drag/mouse events from the
// PanelList. We don't allow users to edit the mosaic since it's just used for the sidebar, so we
// can hide the drop targets.
const HideRootDropTargets = styled.div`
  & > .mosaic > .drop-target-container {
    display: none !important;
  }
`;

export type SidebarItem = {
  iconName: IIconProps["iconName"];
  title: string;
  component: React.ComponentType;
};

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
  dataSidebarKey,
  selected,
  title,
  iconProps,
  onClick,
  menuProps,
}: {
  dataSidebarKey: string; // for storybook
  selected: boolean;
  title: string;
  iconProps?: IIconProps;
  onClick?: () => void;
  menuProps?: IContextualMenuProps;
}) {
  const theme = useTheme();
  return (
    <Stack style={{ position: "relative", flexGrow: 1 }}>
      <CommandBarButton
        data-sidebar-key={dataSidebarKey}
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
        onRenderMenuIcon={() => ReactNull}
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

export default function Sidebar<K extends string>({
  children,
  items,
  bottomItems,
  selectedKey,
  onSelectKey,
}: React.PropsWithChildren<{
  items: Map<K, SidebarItem>;
  bottomItems: readonly K[];
  selectedKey: K | undefined;
  onSelectKey: (key: K | undefined) => void;
}>): JSX.Element {
  const [mosaicValue, setMosaicValue] = useState<MosaicNode<"sidebar" | "children">>("children");

  const theme = useTheme();
  const classNames = useStyles();

  const prevSelectedKey = useRef<string | undefined>(undefined);
  useLayoutEffect(() => {
    if (prevSelectedKey.current !== selectedKey) {
      if (selectedKey == undefined) {
        setMosaicValue("children");
      } else if (prevSelectedKey.current == undefined) {
        setMosaicValue({
          direction: "row",
          first: "sidebar",
          second: "children",
          splitPercentage: 30,
        });
      }
      prevSelectedKey.current = selectedKey;
    }
  }, [selectedKey]);

  const onItemClick = useCallback(
    (key: K) => {
      if (selectedKey === key) {
        onSelectKey(undefined);
      } else {
        onSelectKey(key);
      }
    },
    [onSelectKey, selectedKey],
  );

  const SelectedComponent = (selectedKey != undefined && items.get(selectedKey)?.component) || Noop;

  type OverflowSetItem = IOverflowSetItemProps & { key: K };

  // Callbacks for OverflowSet
  const onRenderItem = useCallback(
    ({ key }: OverflowSetItem) => {
      const item = items.get(key);
      if (!item) {
        throw new Error(`Missing sidebar item ${key}`);
      }
      const { title, iconName } = item;
      return (
        <SidebarButton
          dataSidebarKey={key}
          key={key}
          selected={selectedKey === key}
          title={title}
          iconProps={{ iconName }}
          onClick={() => onItemClick(key)}
        />
      );
    },
    [items, onItemClick, selectedKey],
  );
  const onRenderOverflowButton = useCallback(
    (overflowItems?: OverflowSetItem[]) => {
      if (!overflowItems) {
        return ReactNull;
      }
      const overflowItemSelected = overflowItems.some(({ key }) => selectedKey === key);
      return (
        <SidebarButton
          dataSidebarKey="_overflow"
          selected={overflowItemSelected}
          title="More"
          iconProps={{ iconName: "MoreVertical" }}
          menuProps={{
            directionalHint: DirectionalHint.rightCenter,
            items: overflowItems.map(({ key }) => {
              const item = items.get(key as K);
              if (!item) {
                throw new Error(`Missing sidebar item ${key}`);
              }
              return {
                key,
                checked: selectedKey === key,
                canCheck: overflowItemSelected,
                text: item.title,
                iconProps: { iconName: item.iconName },
                onClick: () => onItemClick(key),
              };
            }),
          }}
        />
      );
    },
    [items, selectedKey, onItemClick],
  );

  // Data and callbacks for ResizeGroup
  type Data = { itemsToShow: number };
  const onRenderData = useCallback(
    ({ itemsToShow }: Data) => {
      const shownItems = filterMap(items.keys(), (key) =>
        bottomItems.includes(key) ? undefined : { key },
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
            onRenderItem={onRenderItem as (_: IOverflowSetItemProps) => unknown}
            onRenderOverflowButton={onRenderOverflowButton}
          />
          <div style={{ flexGrow: 1 }} />
          <Stack
          // extra Stack to match the OverflowSet item's display:flex
          >
            {bottomItems.map((key) => onRenderItem({ key }))}
          </Stack>
        </Stack>
      );
    },
    [items, bottomItems, onRenderItem, onRenderOverflowButton, theme.semanticColors.bodyDivider],
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
        data={{ itemsToShow: items.size - bottomItems.length }}
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
