// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { ChevronRight12Regular } from "@fluentui/react-icons";
import {
  BackdropProps,
  Divider,
  Menu,
  MenuItem,
  PopoverPosition,
  PopoverReference,
} from "@mui/material";
import { Dispatch, MouseEvent, SetStateAction, useState } from "react";
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

const useStyles = makeStyles<void, "icon">()((theme, _params, classes) => ({
  menuItem: {
    justifyContent: "space-between",
    cursor: "pointer",

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
  const { classes, cx } = useStyles();
  const { recentSources, selectRecent } = usePlayerSelection();

  const [fileMenuEl, setFileMenuEl] = useState<undefined | HTMLElement>(undefined);
  const [editMenuEl, setEditMenuEl] = useState<undefined | HTMLElement>(undefined);

  const fileMenuOpen = Boolean(fileMenuEl);
  const editMenuOpen = Boolean(editMenuEl);

  const handleSubMenuClick = (
    event: MouseEvent<HTMLElement>,
    el: HTMLElement | undefined,
    action: Dispatch<SetStateAction<HTMLElement | undefined>>,
  ) => {
    if (el !== event.currentTarget) {
      action(event.currentTarget);
    }
  };

  const handleSubMenuMouseEnter = (
    event: MouseEvent<HTMLElement>,
    action: Dispatch<SetStateAction<HTMLElement | undefined>>,
  ) => {
    action(event.currentTarget);
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
          selected={fileMenuOpen}
          className={classes.menuItem}
          onClick={(event) => handleSubMenuClick(event, fileMenuEl, setFileMenuEl)}
          onMouseEnter={(event) => handleSubMenuMouseEnter(event, setFileMenuEl)}
          onMouseLeave={() => setFileMenuEl(undefined)}
        >
          File <ChevronRight12Regular className={cx(classes.icon, classes.endIcon)} />
        </MenuItem>
        <MenuItem
          selected={editMenuOpen}
          className={classes.menuItem}
          onClick={(event) => handleSubMenuClick(event, editMenuEl, setEditMenuEl)}
          onMouseEnter={(event) => handleSubMenuMouseEnter(event, setEditMenuEl)}
          onMouseLeave={() => setFileMenuEl(undefined)}
        >
          Edit <ChevronRight12Regular className={cx(classes.icon, classes.endIcon)} />
        </MenuItem>
        <MenuItem className={classes.menuItem}>
          Panel <ChevronRight12Regular className={cx(classes.icon, classes.endIcon)} />
        </MenuItem>
        <MenuItem className={classes.menuItem}>
          View <ChevronRight12Regular className={cx(classes.icon, classes.endIcon)} />
        </MenuItem>
        <MenuItem className={classes.menuItem}>
          Layout <ChevronRight12Regular className={cx(classes.icon, classes.endIcon)} />
        </MenuItem>
      </Menu>

      {/* File menu */}
      <Menu
        open={fileMenuOpen}
        disablePortal
        anchorEl={fileMenuEl}
        onClose={() => setFileMenuEl(undefined)}
        onMouseLeave={() => setFileMenuEl(undefined)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        MenuListProps={{ dense: true, className: classes.menuList }}
        autoFocus={false}
        disableAutoFocus
        disableEnforceFocus
        style={{
          pointerEvents: "none",
        }}
        PaperProps={{
          style: {
            pointerEvents: "auto",
          },
        }}
      >
        <MenuItem>Open local file</MenuItem>
        <MenuItem>Open connection</MenuItem>
        <Divider variant="middle" />
        <MenuItem disabled>Recent sources</MenuItem>
        {recentSources.slice(0, 5).map((recent) => (
          <MenuItem
            className={classes.menuItem}
            key={recent.id}
            id={recent.id}
            onClick={() => selectRecent(recent.id)}
          >
            <TextMiddleTruncate text={recent.title} className={classes.truncate} />
          </MenuItem>
        ))}
      </Menu>

      {/* Edit menu */}
      <Menu
        open={editMenuOpen}
        disablePortal
        anchorEl={editMenuEl}
        onClose={() => setEditMenuEl(undefined)}
        onMouseLeave={() => setEditMenuEl(undefined)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        MenuListProps={{ dense: true, className: classes.menuList }}
        autoFocus={false}
        disableAutoFocus
        disableEnforceFocus
        style={{
          pointerEvents: "none",
        }}
        PaperProps={{
          style: {
            pointerEvents: "auto",
          },
        }}
      >
        <MenuItem>Undo</MenuItem>
        <MenuItem>Redo</MenuItem>
        <Divider variant="middle" />
        <MenuItem>Copy</MenuItem>
      </Menu>
    </>
  );
}
