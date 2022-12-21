// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import PersonIcon from "@mui/icons-material/Person";
import {
  Avatar,
  Divider,
  IconButton,
  IconButtonProps,
  ListItemText,
  Menu,
  MenuItem,
} from "@mui/material";
import { forwardRef } from "react";
import { makeStyles } from "tss-react/mui";

// import { useMe } from "~/context/MeContext";

const useStyles = makeStyles()((theme) => ({
  avatar: {
    color: theme.palette.common.white,
    backgroundColor: "#9480ed",
    height: theme.spacing(4),
    width: theme.spacing(4),
  },
  avatarButton: {
    padding: 0,
  },
}));

export const UserIconButton = forwardRef<HTMLButtonElement, IconButtonProps>((props, ref) => {
  const { classes } = useStyles();

  return (
    <IconButton {...props} ref={ref} className={classes.avatarButton}>
      <Avatar className={classes.avatar} variant="rounded">
        <PersonIcon />
      </Avatar>
    </IconButton>
  );
});
UserIconButton.displayName = "UserIconButton";

export function UserMenu({
  anchorEl,
  handleClose,
  open,
}: {
  handleClose: () => void;
  anchorEl?: HTMLElement;
  open: boolean;
}): JSX.Element {
  // const [me] = useMe();

  return (
    <Menu
      anchorEl={anchorEl}
      id="account-menu"
      open={open}
      onClose={handleClose}
      onClick={handleClose}
      MenuListProps={{
        sx: {
          minWidth: 200,
        },
      }}
    >
      <MenuItem href="#profile">
        {/* <ListItemText primary={me.displayName} secondary={me.email} /> */}
      </MenuItem>
      <MenuItem href="#profile">
        <ListItemText>User settings</ListItemText>
      </MenuItem>
      <Divider />
      <MenuItem href="#signout">
        <ListItemText>Log out</ListItemText>
      </MenuItem>
    </Menu>
  );
}
