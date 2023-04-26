// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Divider, Menu, MenuItem, PopoverPosition, PopoverReference } from "@mui/material";
import { useCallback, useMemo, useState } from "react";
import { makeStyles } from "tss-react/mui";
import { shallow } from "zustand/shallow";

import { NestedMenuItem } from "@foxglove/studio-base/components/NestedMenuItem";
import TextMiddleTruncate from "@foxglove/studio-base/components/TextMiddleTruncate";
import { useAnalytics } from "@foxglove/studio-base/context/AnalyticsContext";
import { useCurrentUserType } from "@foxglove/studio-base/context/CurrentUserContext";
import { usePlayerSelection } from "@foxglove/studio-base/context/PlayerSelectionContext";
import {
  WorkspaceContextStore,
  useWorkspaceActions,
  useWorkspaceStore,
} from "@foxglove/studio-base/context/WorkspaceContext";
import { AppEvent } from "@foxglove/studio-base/services/IAnalytics";

type AppMenuProps = {
  handleClose: () => void;
  anchorEl?: HTMLElement;
  anchorReference?: PopoverReference;
  anchorPosition?: PopoverPosition;
  disablePortal?: boolean;
  open: boolean;
};

const useStyles = makeStyles<void, "icon">()((theme, _params, classes) => ({
  menuItem: {
    justifyContent: "space-between",
    cursor: "pointer",
    gap: theme.spacing(2),

    "&.Mui-selected, &.Mui-selected:hover": {
      backgroundColor: theme.palette.action.hover,
    },
    [`:not(:hover, :focus) .${classes.icon}`]: {
      opacity: 0.6,
    },
    kbd: {
      font: "inherit",
      color: theme.palette.text.disabled,
    },
  },
  menuList: {
    minWidth: 180,
    maxWidth: 220,
  },
  icon: {},
  truncate: {
    alignSelf: "center !important",
  },
}));

const selectWorkspace = (store: WorkspaceContextStore) => store;

export function AppMenu(props: AppMenuProps): JSX.Element {
  const { open, handleClose, anchorEl, anchorReference, anchorPosition, disablePortal } = props;
  const { classes } = useStyles();

  const [openItemId, setOpenItemId] = useState<string | undefined>();

  const currentUserType = useCurrentUserType();
  const analytics = useAnalytics();

  const { recentSources, selectRecent } = usePlayerSelection();
  const { leftSidebarOpen, rightSidebarOpen } = useWorkspaceStore(selectWorkspace, shallow);
  const { setRightSidebarOpen, setLeftSidebarOpen, dataSourceDialogActions } =
    useWorkspaceActions();

  const fileItems = useMemo(() => {
    const items: NestedMenuItem[] = [
      {
        type: "item",
        label: "Open local file…",
        key: "open-file",
        onClick: () => {
          dataSourceDialogActions.open("file");
          handleClose();
        },
      },
      {
        type: "item",
        label: "Open connection…",
        key: "open-connection",
        onClick: () => {
          dataSourceDialogActions.open("connection");
          handleClose();
        },
      },
      { type: "divider" },
      { type: "item", label: "Recent sources", key: "recent-sources", disabled: true },
    ];

    recentSources.slice(0, 5).map((recent) => {
      items.push({
        type: "item",
        key: recent.id,
        onClick: () => {
          handleClose();
          selectRecent(recent.id);
        },
        label: <TextMiddleTruncate text={recent.title} className={classes.truncate} />,
      });
    });

    return items;
  }, [classes.truncate, handleClose, recentSources, selectRecent]);

  // VIEW

  const viewItems = useMemo<NestedMenuItem[]>(
    () => [
      {
        type: "item",
        label: `${leftSidebarOpen ? "Hide" : "Show"} left sidebar`,
        key: "left-sidebar",
        shortcut: "[",
        onClick: () => {
          handleClose();
          setLeftSidebarOpen(!leftSidebarOpen);
        },
      },
      {
        type: "item",
        label: `${rightSidebarOpen ? "Hide" : "Show"} right sidebar`,
        key: "right-sidebar",
        shortcut: "]",
        onClick: () => {
          handleClose();
          setRightSidebarOpen(!rightSidebarOpen);
        },
      },
      { type: "divider" },
      { type: "item", label: "Add panel", key: "add-panel" },
    ],
    [handleClose, leftSidebarOpen, rightSidebarOpen, setLeftSidebarOpen, setRightSidebarOpen],
  );

  // HELP

  const onDocsClick = useCallback(() => {
    void analytics.logEvent(AppEvent.APP_MENU_CLICK, {
      user: currentUserType,
      cta: "docs",
    });
    handleClose();
    window.open("https://foxglove.dev/docs", "_blank");
  }, [analytics, currentUserType, handleClose]);

  const onSlackClick = useCallback(() => {
    void analytics.logEvent(AppEvent.APP_MENU_CLICK, {
      user: currentUserType,
      cta: "join-slack",
    });
    handleClose();
    window.open("https://foxglove.dev/slack", "_blank");
  }, [analytics, currentUserType, handleClose]);

  const handleItemPointerEnter = useCallback((id: string) => {
    setOpenItemId(id);
  }, []);

  const helpItems = useMemo<NestedMenuItem[]>(
    () => [
      {
        type: "item",
        key: "appversion",
        label: "App version",
      },
      { type: "divider" },
      { type: "item", label: "Documentation", key: "docs", onClick: onDocsClick, external: true },
      { type: "item", label: "Join Slack", key: "slack", onClick: onSlackClick, external: true },
    ],
    [onDocsClick, onSlackClick],
  );

  return (
    <>
      <Menu
        anchorEl={anchorEl}
        anchorReference={anchorReference}
        anchorPosition={anchorPosition}
        disablePortal={disablePortal}
        id="app-menu"
        open={open}
        disableAutoFocusItem
        onClose={handleClose}
        MenuListProps={{ dense: true, className: classes.menuList }}
      >
        <MenuItem className={classes.menuItem} onPointerEnter={() => setOpenItemId(undefined)}>
          Back to Data Platform
        </MenuItem>
        <Divider variant="middle" />
        <NestedMenuItem
          onPointerEnter={handleItemPointerEnter}
          items={fileItems}
          open={openItemId === "app-menu-file"}
          id="app-menu-file"
        >
          File
        </NestedMenuItem>
        <NestedMenuItem
          onPointerEnter={handleItemPointerEnter}
          items={viewItems}
          open={openItemId === "app-menu-view"}
          id="app-menu-view"
        >
          View
        </NestedMenuItem>
        <NestedMenuItem
          onPointerEnter={handleItemPointerEnter}
          items={helpItems}
          open={openItemId === "app-menu-help"}
          id="app-menu-help"
        >
          Help
        </NestedMenuItem>
      </Menu>
    </>
  );
}
