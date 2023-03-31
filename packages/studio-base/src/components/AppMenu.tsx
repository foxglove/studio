// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { ChevronRight12Regular } from "@fluentui/react-icons";
import { Divider, Menu, MenuItem, PopoverPosition, PopoverReference } from "@mui/material";
import { MouseEvent, useCallback, useState } from "react";
import { makeStyles } from "tss-react/mui";

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

    [`:not(:hover, :focus) .${classes.icon}`]: {
      opacity: 0.6,
    },
  },
  menuList: {
    minWidth: 180,
  },
  icon: {},
  endIcon: {
    marginRight: theme.spacing(-0.5),
  },
}));

export default function AppMenu(props: AppMenuProps): JSX.Element {
  const { open, handleClose, anchorEl, anchorReference, anchorPosition, disablePortal } = props;
  const { classes, cx } = useStyles();

  const [subMenuAnchorEl, setSubMenuAnchorEl] = useState<undefined | HTMLElement>(undefined);
  const [subSubMenuAnchorEl, setSubSubMenuAnchorEl] = useState<undefined | HTMLElement>(undefined);

  const subMenuOpen = Boolean(subMenuAnchorEl);
  const subSubMenuOpen = Boolean(subSubMenuAnchorEl);

  const handleSubMenuClick = (event: MouseEvent<HTMLElement>) => {
    if (subMenuAnchorEl !== event.currentTarget) {
      setSubMenuAnchorEl(event.currentTarget);
    }
  };

  const handleSubSubMenuClick = (event: MouseEvent<HTMLElement>) => {
    if (subSubMenuAnchorEl !== event.currentTarget) {
      setSubSubMenuAnchorEl(event.currentTarget);
    }
  };

  const handleSubMenuMouseEnter = (event: MouseEvent<HTMLElement>) => {
    setSubMenuAnchorEl(event.currentTarget);
  };

  const handleSubSubMenuMouseEnter = (event: MouseEvent<HTMLElement>) => {
    setSubSubMenuAnchorEl(event.currentTarget);
  };

  return (
    <>
      <Menu
        anchorEl={anchorEl}
        anchorReference={anchorReference}
        anchorPosition={anchorPosition}
        disablePortal={disablePortal}
        id="app-menu"
        open={open}
        onClose={handleClose}
        MenuListProps={{ dense: true, className: classes.menuList }}
      >
        <MenuItem className={classes.menuItem}>Back to Data Platform</MenuItem>
        <Divider variant="middle" />
        <MenuItem
          className={classes.menuItem}
          onClick={handleSubMenuClick}
          onMouseEnter={handleSubMenuMouseEnter}
        >
          File <ChevronRight12Regular className={cx(classes.icon, classes.endIcon)} />
        </MenuItem>
      </Menu>
      <Menu
        open={subMenuOpen}
        anchorEl={subMenuAnchorEl}
        onClose={() => setSubMenuAnchorEl(undefined)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        MenuListProps={{ dense: true, className: classes.menuList }}
      >
        <MenuItem>Open local file</MenuItem>
        <MenuItem>Open connection</MenuItem>
        <MenuItem
          className={classes.menuItem}
          onClick={handleSubSubMenuClick}
          onMouseEnter={handleSubSubMenuMouseEnter}
        >
          Open recent <ChevronRight12Regular className={cx(classes.icon, classes.endIcon)} />
        </MenuItem>
      </Menu>
      <Menu
        open={subSubMenuOpen}
        anchorEl={subSubMenuAnchorEl}
        onClose={() => setSubSubMenuAnchorEl(undefined)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        MenuListProps={{ dense: true, className: classes.menuList }}
      >
        <MenuItem>Some file name</MenuItem>
        <MenuItem>Some file name</MenuItem>
        <MenuItem>Some file name</MenuItem>
        <MenuItem>Some file name</MenuItem>
      </Menu>
    </>
  );
}
