// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Badge, Tab, Tabs, Theme, useTheme } from "@mui/material";
import { makeStyles } from "@mui/styles";
import {
  useLayoutEffect,
  useRef,
  useState,
  PropsWithChildren,
  useMemo,
  ComponentProps,
} from "react";
import { MosaicNode, MosaicWithoutDragDropContext } from "react-mosaic-component";

import { BuiltinIcon } from "@foxglove/studio-base/components/BuiltinIcon";
import ErrorBoundary from "@foxglove/studio-base/components/ErrorBoundary";
import Stack from "@foxglove/studio-base/components/Stack";

function Noop(): ReactNull {
  return ReactNull;
}

export type SidebarItem = {
  iconName: ComponentProps<typeof BuiltinIcon>["name"];
  title: string;
  badge?: { count: number };
  component?: React.ComponentType;
  url?: string;
};

const useStyles = makeStyles((theme: Theme) => ({
  nav: {
    boxSizing: "content-box",
    borderRight: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
  },
  mosaicWrapper: {
    flex: "1 1 100%",

    // Root drop targets in this top level sidebar mosaic interfere with drag/mouse events from the
    // PanelList. We don't allow users to edit the mosaic since it's just used for the sidebar, so we
    // can hide the drop targets.
    "& > .mosaic > .drop-target-container": {
      display: "none !important",
    },
  },
}));

// Determine initial sidebar width, with a cap for larger
// screens.
function defaultInitialSidebarPercentage() {
  const defaultFraction = 0.3;
  const width = Math.min(384, defaultFraction * window.innerWidth);
  return (100 * width) / window.innerWidth;
}

type SidebarProps<K> = PropsWithChildren<{
  items: Map<K, SidebarItem>;
  bottomItems: Map<K, SidebarItem>;
  selectedKey: K | undefined;
  onSelectKey: (key: K | undefined) => void;
}>;

export default function Sidebar<K extends string>(props: SidebarProps<K>): JSX.Element {
  const { children, items, bottomItems, selectedKey, onSelectKey } = props;

  const [mosaicValue, setMosaicValue] = useState<MosaicNode<"sidebar" | "children">>("children");

  const theme = useTheme();
  const classes = useStyles();

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
          splitPercentage: defaultInitialSidebarPercentage(),
        });
      }
      prevSelectedKey.current = selectedKey;
    }
  }, [selectedKey]);

  const SelectedComponent = (selectedKey != undefined && items.get(selectedKey)?.component) || Noop;

  const onHandleChange = (_ev: unknown, value: K) => {
    onSelectKey(value);
  };

  const topTabs = useMemo(() => {
    return [...items.entries()].map(([key, item]) => (
      <Tab
        value={key}
        key={key}
        style={{ minWidth: "50px" }}
        title={item.title}
        icon={
          <Badge
            badgeContent={item.badge?.count}
            invisible={item.badge == undefined}
            color="primary"
          >
            <BuiltinIcon name={item.iconName} />
          </Badge>
        }
      />
    ));
  }, [items]);

  const bottomTabs = useMemo(() => {
    return [...bottomItems.entries()].map(([key, item]) => (
      <Tab
        value={key}
        key={key}
        style={{ minWidth: "50px" }}
        title={item.title}
        icon={
          <Badge
            badgeContent={item.badge?.count}
            invisible={item.badge == undefined}
            color="primary"
          >
            <BuiltinIcon name={item.iconName} />
          </Badge>
        }
      />
    ));
  }, [bottomItems]);

  return (
    <Stack direction="row" fullHeight overflow="hidden">
      <Stack className={classes.nav} flexShrink={0} justifyContent="space-between">
        <Tabs
          orientation="vertical"
          variant="scrollable"
          value={selectedKey ?? false}
          scrollButtons={false}
          onChange={onHandleChange}
        >
          {topTabs}
        </Tabs>
        <Tabs
          orientation="vertical"
          variant="scrollable"
          value={selectedKey ?? false}
          scrollButtons={false}
          onChange={onHandleChange}
        >
          {bottomTabs}
        </Tabs>
      </Stack>
      {
        // By always rendering the mosaic, even if we are only showing children, we can prevent the
        // children from having to re-mount each time the sidebar is opened/closed.
      }
      <div className={classes.mosaicWrapper}>
        <MosaicWithoutDragDropContext<"sidebar" | "children">
          className=""
          value={mosaicValue}
          onChange={(value) => value != undefined && setMosaicValue(value)}
          renderTile={(id) => (
            <ErrorBoundary>
              {id === "children" ? (
                (children as JSX.Element)
              ) : (
                <div
                  style={{
                    backgroundColor: theme.palette.background.paper,
                  }}
                >
                  <SelectedComponent />
                </div>
              )}
            </ErrorBoundary>
          )}
          resize={{ minimumPaneSizePercentage: 10 }}
        />
      </div>
    </Stack>
  );
}
