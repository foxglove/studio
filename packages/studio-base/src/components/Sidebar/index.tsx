// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { Badge, Paper, Tab, Tabs } from "@mui/material";
import {
  ComponentProps,
  MouseEvent,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { MosaicNode, MosaicWithoutDragDropContext } from "react-mosaic-component";
import { makeStyles } from "tss-react/mui";

import { AppSetting } from "@foxglove/studio-base/AppSetting";
import { HelpMenu } from "@foxglove/studio-base/components/AppBar/Help";
import { BuiltinIcon } from "@foxglove/studio-base/components/BuiltinIcon";
import ErrorBoundary from "@foxglove/studio-base/components/ErrorBoundary";
import { MemoryUseIndicator } from "@foxglove/studio-base/components/MemoryUseIndicator";
import { NewSidebar, NewSidebarTab } from "@foxglove/studio-base/components/NewSidebar";
import Stack from "@foxglove/studio-base/components/Stack";
import { useWorkspace } from "@foxglove/studio-base/context/WorkspaceContext";
import { useAppConfigurationValue } from "@foxglove/studio-base/hooks";
import isDesktopApp from "@foxglove/studio-base/util/isDesktopApp";

import { TabSpacer } from "./TabSpacer";

function Noop(): ReactNull {
  return ReactNull;
}

type LayoutNode = "leftbar" | "children" | "rightbar";

export type SidebarItem = {
  iconName: ComponentProps<typeof BuiltinIcon>["name"];
  title: string;
  badge?: { count: number };
  component?: React.ComponentType;
  url?: string;
};

const useStyles = makeStyles()((theme) => ({
  leftNav: {
    boxSizing: "content-box",
    borderRight: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
  },
  tabs: {
    flexGrow: 1,

    ".MuiTabs-flexContainerVertical": {
      height: "100%",
    },
  },
  tab: {
    padding: theme.spacing(1.625),
    minWidth: 50,
  },
  badge: {
    "> *:not(.MuiBadge-badge)": {
      width: "1.5rem",
      height: "1.5rem",
      fontSize: "1.5rem",
      display: "flex",

      ".root-span": {
        display: "contents",
      },
      svg: {
        fontSize: "inherit",
        width: "auto",
        height: "auto",
      },
    },
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

/**
 * Extract existing left split percentage from a layout node or return the default.
 */
function mosiacLeftSidebarSplitPercentage(node: MosaicNode<LayoutNode>): number | undefined {
  if (typeof node !== "object") {
    return undefined;
  }
  if (node.first === "leftbar") {
    return node.splitPercentage;
  } else {
    return (
      mosiacLeftSidebarSplitPercentage(node.first) ?? mosiacLeftSidebarSplitPercentage(node.second)
    );
  }
}

/**
 * Extract existing right split percentage from a layout node or return the default.
 */
function mosiacRightSidebarSplitPercentage(node: MosaicNode<LayoutNode>): number | undefined {
  if (typeof node !== "object") {
    return undefined;
  }
  if (node.second === "rightbar") {
    return node.splitPercentage;
  } else {
    return (
      mosiacRightSidebarSplitPercentage(node.first) ??
      mosiacRightSidebarSplitPercentage(node.second)
    );
  }
}

type SidebarProps<K> = PropsWithChildren<{
  items: Map<K, SidebarItem>;
  bottomItems: Map<K, SidebarItem>;
  selectedKey: K | undefined;
  onSelectKey: (key: K | undefined) => void;
}>;

export default function Sidebar<K extends string>(props: SidebarProps<K>): JSX.Element {
  const { children, items, bottomItems, selectedKey, onSelectKey } = props;

  const [enableMemoryUseIndicator = false] = useAppConfigurationValue<boolean>(
    AppSetting.ENABLE_MEMORY_USE_INDICATOR,
  );
  // Since we can't toggle the title bar on an electron window, keep the setting at its initial
  // value until the app is reloaded/relaunched.
  const [currentEnableNewTopNav = false] = useAppConfigurationValue<boolean>(
    AppSetting.ENABLE_NEW_TOPNAV,
  );
  const [initialEnableNewTopNav] = useState(currentEnableNewTopNav);
  const enableNewTopNav = isDesktopApp() ? initialEnableNewTopNav : currentEnableNewTopNav;

  const { rightSidebarOpen, setRightSidebarOpen } = useWorkspace();

  const [mosaicValue, setMosaicValue] = useState<MosaicNode<LayoutNode>>("children");
  const { classes } = useStyles();

  const allItems = useMemo(() => {
    return new Map([...items, ...bottomItems]);
  }, [bottomItems, items]);

  const [helpAnchorEl, setHelpAnchorEl] = useState<undefined | HTMLElement>(undefined);
  const [activeRightTab, setActiveRightTab] = useState<NewSidebarTab>("variables");

  const helpMenuOpen = Boolean(helpAnchorEl);

  const handleHelpClick = (event: MouseEvent<HTMLElement>) => {
    setHelpAnchorEl(event.currentTarget);
  };
  const handleHelpClose = () => {
    setHelpAnchorEl(undefined);
  };

  const leftSidebarOpen = selectedKey != undefined && allItems.has(selectedKey);

  useEffect(() => {
    const width = Math.min(384, 0.3 * window.innerWidth);
    const defaultLeftPercentage = (100 * width) / window.innerWidth;
    const defaultRightPercentage = 80;
    setMosaicValue((oldValue) => {
      let node: MosaicNode<LayoutNode> = "children";
      if (rightSidebarOpen) {
        node = {
          direction: "row",
          first: node,
          second: "rightbar",
          splitPercentage: mosiacRightSidebarSplitPercentage(oldValue) ?? defaultRightPercentage,
        };
      }
      if (leftSidebarOpen) {
        node = {
          direction: "row",
          first: "leftbar",
          second: node,
          splitPercentage: mosiacLeftSidebarSplitPercentage(oldValue) ?? defaultLeftPercentage,
        };
      }
      return node;
    });
  }, [leftSidebarOpen, rightSidebarOpen]);

  const SelectedComponent =
    (selectedKey != undefined && allItems.get(selectedKey)?.component) || Noop;

  const onClickTabAction = useCallback(
    (key: K) => {
      // toggle tab selected/unselected on click
      if (selectedKey === key) {
        onSelectKey(undefined);
      } else {
        onSelectKey(key);
      }
    },
    [selectedKey, onSelectKey],
  );

  const topTabs = useMemo(() => {
    return [...items.entries()].map(([key, item]) => (
      <Tab
        data-sidebar-key={key}
        className={classes.tab}
        value={key}
        key={key}
        title={item.title}
        onClick={() => onClickTabAction(key)}
        icon={
          <Badge
            className={classes.badge}
            badgeContent={item.badge?.count}
            invisible={item.badge == undefined}
            color="error"
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
          >
            <BuiltinIcon name={item.iconName} />
          </Badge>
        }
      />
    ));
  }, [classes, items, onClickTabAction]);

  const bottomTabs = useMemo(() => {
    return [...bottomItems.entries()].map(([key, item]) => (
      <Tab
        className={classes.tab}
        value={key}
        key={key}
        title={item.title}
        onClick={() => onClickTabAction(key)}
        icon={
          <Badge
            className={classes.badge}
            badgeContent={item.badge?.count}
            invisible={item.badge == undefined}
            color="error"
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
          >
            <BuiltinIcon name={item.iconName} />
          </Badge>
        }
      />
    ));
  }, [bottomItems, classes, onClickTabAction]);

  return (
    <Stack direction="row" fullHeight overflow="hidden">
      <Stack className={classes.leftNav} flexShrink={0} justifyContent="space-between">
        <Tabs
          className={classes.tabs}
          orientation="vertical"
          variant="scrollable"
          value={selectedKey ?? false}
          scrollButtons={false}
        >
          {topTabs}
          <TabSpacer />
          {!enableNewTopNav && enableMemoryUseIndicator && <MemoryUseIndicator />}
          {!enableNewTopNav && (
            <Tab
              className={classes.tab}
              color="inherit"
              id="help-button"
              aria-label="Help menu button"
              aria-controls={helpMenuOpen ? "help-menu" : undefined}
              aria-haspopup="true"
              aria-expanded={helpMenuOpen ? "true" : undefined}
              onClick={(event) => handleHelpClick(event)}
              icon={<HelpOutlineIcon color={helpMenuOpen ? "primary" : "inherit"} />}
            />
          )}
          {bottomTabs}
        </Tabs>
        {!enableNewTopNav && (
          <HelpMenu
            anchorEl={helpAnchorEl}
            open={helpMenuOpen}
            handleClose={handleHelpClose}
            anchorOrigin={{
              horizontal: "right",
              vertical: "bottom",
            }}
            transformOrigin={{
              vertical: "bottom",
              horizontal: "left",
            }}
          />
        )}
      </Stack>
      {
        // By always rendering the mosaic, even if we are only showing children, we can prevent the
        // children from having to re-mount each time the sidebar is opened/closed.
      }
      <div className={classes.mosaicWrapper}>
        <MosaicWithoutDragDropContext<LayoutNode>
          className=""
          value={mosaicValue}
          onChange={(value) => value != undefined && setMosaicValue(value)}
          renderTile={(id) => {
            switch (id) {
              case "children":
                return <ErrorBoundary>{children as JSX.Element}</ErrorBoundary>;
              case "leftbar":
                return (
                  <ErrorBoundary>
                    <Paper square elevation={0}>
                      <SelectedComponent />
                    </Paper>
                  </ErrorBoundary>
                );
              case "rightbar":
                return (
                  <ErrorBoundary>
                    <NewSidebar
                      anchor="right"
                      onClose={() => setRightSidebarOpen((old) => !old)}
                      activeTab={activeRightTab}
                      setActiveTab={setActiveRightTab}
                    />
                  </ErrorBoundary>
                );
            }
          }}
          resize={{ minimumPaneSizePercentage: 10 }}
        />
      </div>
    </Stack>
  );
}
