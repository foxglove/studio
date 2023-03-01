// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Menu } from "@mui/material";
import { makeStyles } from "tss-react/mui";

import LayoutBrowser from "@foxglove/studio-base/components/LayoutBrowser";

const useStyles = makeStyles()({
  paper: {
    // default spacing + top nav height + playback bar
    maxHeight: "calc(100% - 32px - 48px - 48px)",
  },
});

type LayoutMenuProps = {
  anchorEl?: HTMLElement;
  handleClose: () => void;
  supportsSignIn?: boolean;
  open: boolean;
};

export function LayoutMenu({
  anchorEl,
  handleClose,
  open,
  supportsSignIn,
}: LayoutMenuProps): JSX.Element {
  const { classes } = useStyles();

  return (
    <Menu
      id="layout-menu"
      anchorEl={anchorEl}
      open={open}
      onClose={handleClose}
      MenuListProps={{
        disablePadding: true,
        "aria-labelledby": "layout-button",
      }}
      PaperProps={{
        className: classes.paper,
      }}
      anchorOrigin={{
        horizontal: "left",
        vertical: "bottom",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "left",
      }}
    >
      <LayoutBrowser supportsSignIn={supportsSignIn} />
    </Menu>
  );
}
