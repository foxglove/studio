// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Menu } from "@mui/material";
import { makeStyles } from "tss-react/mui";

import PanelList from "@foxglove/studio-base/components/PanelList";
import useAddPanel from "@foxglove/studio-base/hooks/useAddPanel";

const useStyles = makeStyles()({
  paper: {
    // default spacing + top nav height + playback bar
    maxHeight: "calc(100% - 32px - 48px - 48px)",
  },
});

type AddPanelProps = {
  anchorEl?: HTMLElement;
  handleClose: () => void;
  open: boolean;
};

export function AddPanelMenu({ anchorEl, handleClose, open }: AddPanelProps): JSX.Element {
  const { classes } = useStyles();
  const addPanel = useAddPanel();

  return (
    <Menu
      id="add-panel-menu"
      anchorEl={anchorEl}
      open={open}
      onClose={handleClose}
      MenuListProps={{
        disablePadding: true,
        "aria-labelledby": "add-panel-button",
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
      <PanelList
        // Close when a drag starts so the modal menu doesn't block the drop targets
        onDragStart={handleClose}
        onPanelSelect={addPanel}
      />
    </Menu>
  );
}
