// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Dismiss12Regular } from "@fluentui/react-icons";
import {
  Badge,
  BadgeProps,
  Divider,
  IconButton,
  Tab,
  Tabs,
  tabClasses,
  tabsClasses,
} from "@mui/material";
import { makeStyles } from "tss-react/mui";

const useStyles = makeStyles()((theme) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    overflow: "hidden",
    boxSizing: "content-box",
    backgroundColor: theme.palette.background.paper,
  },
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badgeRoot: {
    display: "flex",
    alignItems: "baseline",
    gap: theme.spacing(1),
  },
  badge: {
    fontSize: theme.typography.caption.fontSize,
    padding: theme.spacing(0.125, 0.75),
    borderRadius: 8,
    transform: "none",
    position: "relative",
  },
  badgeInvisible: {
    display: "none",
  },
  anchorRight: {
    borderLeft: `1px solid ${theme.palette.divider}`,
  },
  anchorLeft: {
    borderRight: `1px solid ${theme.palette.divider}`,
  },
  tabs: {
    minHeight: "auto",
    flex: "1 1 auto",
    overflow: "hidden",
    paddingLeft: theme.spacing(0.25),

    [`.${tabsClasses.indicator}`]: {
      transform: "scaleX(0.5)",
      height: 2,
    },
    [`.${tabClasses.root}`]: {
      minHeight: 30,
      minWidth: theme.spacing(4),
      padding: theme.spacing(0, 1),
      color: theme.palette.text.secondary,
      fontSize: "0.6875rem",

      "&.Mui-selected": {
        color: theme.palette.text.primary,
      },
    },
  },
  iconButton: {
    padding: theme.spacing(1.125),
    color: theme.palette.text.secondary,
    borderRadius: 0,

    ":hover": {
      color: theme.palette.text.primary,
    },
  },
  tabContent: {
    flex: "auto",
    overflow: "auto",
  },
}));

export type SidebarItem = {
  title: string;
  component: React.ComponentType;
  badge?: {
    color: BadgeProps["color"];
    count: number;
  };
};

function Noop(): ReactNull {
  return ReactNull;
}

export function Sidebar<K extends string>({
  items,
  anchor,
  onClose,
  activeTab,
  setActiveTab,
}: {
  items: Map<K, SidebarItem>;
  anchor: "right" | "left";
  onClose: () => void;
  activeTab: K | undefined;
  setActiveTab: (newValue: K) => void;
}): JSX.Element {
  const { classes, cx } = useStyles();

  const SelectedComponent = (activeTab && items.get(activeTab)?.component) ?? Noop;

  return (
    <div
      data-tourid={`sidebar-${anchor}`}
      className={cx(classes.root, {
        [classes.anchorLeft]: anchor === "left",
        [classes.anchorRight]: anchor === "right",
      })}
    >
      <div className={classes.toolbar}>
        <Tabs
          className={classes.tabs}
          textColor="inherit"
          value={activeTab ?? false}
          onChange={(_ev, newValue: K) => {
            if (newValue !== activeTab) {
              setActiveTab(newValue);
            }
          }}
        >
          {Array.from(items.entries(), ([key, item]) => (
            <Tab
              key={key}
              label={
                <Badge
                  invisible={item.badge == undefined}
                  badgeContent={item.badge?.count}
                  color={item.badge?.color}
                  classes={{
                    root: classes.badgeRoot,
                    badge: classes.badge,
                    invisible: classes.badgeInvisible,
                  }}
                >
                  {item.title}
                </Badge>
              }
              value={key}
              data-testid={`${key}-${anchor}`}
            />
          ))}
        </Tabs>

        <IconButton
          className={classes.iconButton}
          onClick={onClose}
          data-testid={`sidebar-close-${anchor}`}
        >
          <Dismiss12Regular />
        </IconButton>
      </div>
      <Divider />
      {activeTab != undefined && (
        <div className={classes.tabContent}>
          <SelectedComponent />
        </div>
      )}
    </div>
  );
}
