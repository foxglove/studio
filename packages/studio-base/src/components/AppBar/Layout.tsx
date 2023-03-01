// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Menu, MenuProps } from "@mui/material";

import LayoutBrowser from "@foxglove/studio-base/components/LayoutBrowser";

export function LayoutMenu(
  props: {
    supportsSignIn?: boolean;
    handleClose: () => void;
  } & MenuProps,
): JSX.Element {
  const { anchorEl, handleClose, open, supportsSignIn, ...menuProps } = props;

  return (
    <Menu
      {...menuProps}
      id="layout-menu"
      anchorEl={anchorEl}
      open={open}
      onClose={handleClose}
      MenuListProps={{
        disablePadding: true,
        "aria-labelledby": "layout-button",
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
