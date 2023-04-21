// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { ChevronRight12Regular, Open16Regular } from "@fluentui/react-icons";
import { Divider, Menu, MenuItem, MenuItemProps, useTheme } from "@mui/material";
import {
  Dispatch,
  MouseEvent,
  PropsWithChildren,
  ReactNode,
  SetStateAction,
  useState,
} from "react";
import { makeStyles } from "tss-react/mui";

export type NestedMenuItem =
  | {
      type: "item";
      label: ReactNode;
      key: string;
      disabled?: boolean;
      shortcut?: string;
      onClick?: MenuItemProps["onClick"];
      external?: boolean;
    }
  | { type: "divider" };

const useStyles = makeStyles<void, "endIcon">()((theme, _params, classes) => ({
  menu: {
    pointerEvents: "none",
  },
  paper: {
    pointerEvents: "auto",
    marginTop: theme.spacing(-1),
  },
  menuItem: {
    justifyContent: "space-between",
    cursor: "pointer",
    gap: theme.spacing(2),

    "&.Mui-selected, &.Mui-selected:hover": {
      backgroundColor: theme.palette.action.hover,
    },
    [`:not(:hover, :focus) .${classes.endIcon}`]: {
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
  endIcon: {
    marginRight: theme.spacing(-0.75),
  },
}));

export function NestedMenuItem(
  props: PropsWithChildren<{
    items: NestedMenuItem[];
    subMenu?: HTMLElement;
    setSubMenu: Dispatch<SetStateAction<HTMLElement | undefined>>;
    subMenuOpen: boolean;
    id?: string;
  }>,
): JSX.Element {
  const { classes } = useStyles();
  const theme = useTheme();
  const { children, items, subMenu, subMenuOpen, setSubMenu, id } = props;
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
        id={id}
        selected={open}
        className={classes.menuItem}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        data-testid={id}
      >
        {children}
        <ChevronRight12Regular className={classes.endIcon} />
      </MenuItem>
      <Menu
        classes={{
          root: classes.menu,
          paper: classes.paper,
        }}
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
        hideBackdrop
      >
        {items.map((item, idx) =>
          item.type !== "divider" ? (
            <MenuItem
              className={classes.menuItem}
              key={item.key}
              onClick={item.onClick}
              disabled={item.disabled}
            >
              {item.label}
              {item.shortcut ? (
                <kbd>{item.shortcut}</kbd>
              ) : item.external ?? false ? (
                <Open16Regular
                  className={classes.endIcon}
                  primaryFill={theme.palette.primary.main}
                />
              ) : undefined}
            </MenuItem>
          ) : (
            <Divider key={`${idx}-divider`} variant="middle" />
          ),
        )}
      </Menu>
    </>
  );
}
