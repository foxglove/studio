// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { ChevronRight12Regular } from "@fluentui/react-icons";
import { Divider, Menu, MenuItem, PopoverPosition, PopoverReference } from "@mui/material";
import {
  Dispatch,
  MouseEvent,
  PropsWithChildren,
  ReactNode,
  SetStateAction,
  useMemo,
  useState,
} from "react";
import { makeStyles } from "tss-react/mui";

import TextMiddleTruncate from "@foxglove/studio-base/components/TextMiddleTruncate";
import { usePlayerSelection } from "@foxglove/studio-base/context/PlayerSelectionContext";

type AppMenuProps = {
  handleClose: () => void;
  anchorEl?: HTMLElement;
  anchorReference?: PopoverReference;
  anchorPosition?: PopoverPosition;
  disablePortal?: boolean;
  open: boolean;
};

type NestedMenuItem =
  | {
      type: "item";
      label: ReactNode;
      key: string;
      disabled?: boolean;
      onClick?: () => void;
    }
  | { type: "divider" };

const useStyles = makeStyles<void, "icon">()((theme, _params, classes) => ({
  menuItem: {
    justifyContent: "space-between",
    cursor: "pointer",

    "&.Mui-selected, &.Mui-selected:hover": {
      backgroundColor: theme.palette.action.hover,
    },
    [`:not(:hover, :focus) .${classes.icon}`]: {
      opacity: 0.6,
    },
  },
  menuList: {
    minWidth: 180,
    maxWidth: 220,
  },
  icon: {},
  endIcon: {
    marginRight: theme.spacing(-0.5),
  },
  truncate: {
    alignSelf: "center !important",
  },
}));

export default function AppMenu(props: AppMenuProps): JSX.Element {
  const { open, handleClose, anchorEl, anchorReference, anchorPosition, disablePortal } = props;
  const { classes } = useStyles();

  const [subMenu, setSubMenu] = useState<undefined | HTMLElement>(undefined);
  const subMenuOpen = Boolean(subMenu);

  const { recentSources, selectRecent } = usePlayerSelection();

  const fileItems = useMemo(() => {
    const items: NestedMenuItem[] = [
      { type: "item", label: "Open local file…", key: "open-file", onClick: () => {} },
      { type: "item", label: "Open connection…", key: "open-connection", onClick: () => {} },
      { type: "divider" },
      { type: "item", label: "Recent sources", key: "recent-sources", disabled: true },
    ];

    recentSources.slice(0, 5).map((recent) => {
      items.push({
        type: "item",
        key: recent.id,
        onClick: () => selectRecent(recent.id),
        label: <TextMiddleTruncate text={recent.title} className={classes.truncate} />,
      });
    });

    return items;
  }, [classes.truncate, recentSources, selectRecent]);

  const editItems = useMemo(
    () =>
      [
        { type: "item", label: "Undo", key: "undo" },
        { type: "item", label: "Redo", key: "undo" },
        { type: "divider" },
        { type: "item", label: "Copy", key: "undo" },
      ] as NestedMenuItem[],
    [],
  );

  const panelItems = useMemo(
    () =>
      [
        { type: "item", label: "Fullscreen", key: "fullscreen" },
        { type: "divider" },
        { type: "item", label: "Change panel", key: "change-panel" },
        { type: "item", label: "Remove", key: "remove-panel" },
        { type: "divider" },
        { type: "item", label: "Split up", key: "split-up" },
        { type: "item", label: "Split down", key: "split-down" },
        { type: "item", label: "Split left", key: "split-left" },
        { type: "item", label: "Split right", key: "split-right" },
      ] as NestedMenuItem[],
    [],
  );

  const workspaceItems = useMemo(
    () =>
      [
        { type: "item", label: "Left sidebar", key: "left-sidebar" },
        { type: "item", label: "Right sidebar", key: "left-sidebar" },
        { type: "divider" },
        { type: "item", label: "Add panel", key: "add-panel" },
      ] as NestedMenuItem[],
    [],
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
        <MenuItem className={classes.menuItem}>Back to Data Platform</MenuItem>
        <Divider variant="middle" />
        <NestedMenuItem
          setSubMenu={setSubMenu}
          subMenu={subMenu}
          subMenuOpen={subMenuOpen}
          items={fileItems}
        >
          File
        </NestedMenuItem>
        <NestedMenuItem
          setSubMenu={setSubMenu}
          subMenu={subMenu}
          subMenuOpen={subMenuOpen}
          items={editItems}
        >
          Edit
        </NestedMenuItem>
        <NestedMenuItem
          setSubMenu={setSubMenu}
          subMenu={subMenu}
          subMenuOpen={subMenuOpen}
          items={panelItems}
        >
          Panel
        </NestedMenuItem>
        <NestedMenuItem
          setSubMenu={setSubMenu}
          subMenu={subMenu}
          subMenuOpen={subMenuOpen}
          items={workspaceItems}
        >
          Workspace
        </NestedMenuItem>
      </Menu>
    </>
  );
}

export function NestedMenuItem(
  props: PropsWithChildren<{
    items: NestedMenuItem[];
    subMenu?: HTMLElement;
    setSubMenu: Dispatch<SetStateAction<HTMLElement | undefined>>;
    subMenuOpen: boolean;
  }>,
): JSX.Element {
  const { classes, cx } = useStyles();
  const { children, items, subMenu, subMenuOpen, setSubMenu } = props;
  const [anchorEl, setAnchorEl] = useState<undefined | HTMLElement>(undefined);
  const open = Boolean(anchorEl);

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    if (anchorEl !== event.currentTarget) {
      setSubMenu(event.currentTarget);
      setAnchorEl(event.currentTarget);
    }
  };

  const handleMouseEnter = (event: MouseEvent<HTMLElement>) => {
    setSubMenu(event.currentTarget);
    setAnchorEl(event.currentTarget);
  };

  const handleMouseLeave = (event: MouseEvent<HTMLElement>) => {
    if (!subMenuOpen && subMenu !== event.currentTarget) {
      setAnchorEl(undefined);
    }
    setSubMenu(undefined);
  };

  return (
    <>
      <MenuItem
        selected={open}
        className={classes.menuItem}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
        <ChevronRight12Regular className={cx(classes.icon, classes.endIcon)} />
      </MenuItem>
      <Menu
        open={open}
        disablePortal
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(undefined)}
        onMouseLeave={() => {
          setAnchorEl(undefined);
          setSubMenu(undefined);
        }}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        MenuListProps={{ dense: true, className: classes.menuList }}
        autoFocus={false}
        disableAutoFocus
        disableEnforceFocus
        style={{
          pointerEvents: "none",
        }}
        hideBackdrop
        PaperProps={{
          style: {
            pointerEvents: "auto",
          },
        }}
      >
        {items.map((item, idx) =>
          item.type !== "divider" ? (
            <MenuItem key={item.key} onClick={item.onClick} disabled={item.disabled}>
              {item.label}
            </MenuItem>
          ) : (
            <Divider key={`${idx}-divider`} variant="middle" />
          ),
        )}
      </Menu>
    </>
  );
}
