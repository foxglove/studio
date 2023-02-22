// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { SlideAdd24Regular } from "@fluentui/react-icons";
import { Menu, IconButton, IconButtonProps, MenuProps } from "@mui/material";
import { forwardRef } from "react";
import { makeStyles } from "tss-react/mui";

import PanelList from "@foxglove/studio-base/components/PanelList";
import {
  LayoutState,
  useCurrentLayoutSelector,
} from "@foxglove/studio-base/context/CurrentLayoutContext";
import useAddPanel from "@foxglove/studio-base/hooks/useAddPanel";

const useStyles = makeStyles()((theme) => ({
  iconButton: {
    padding: theme.spacing(0.375),
  },
}));

export const AddPanelIconButton = forwardRef<HTMLButtonElement, IconButtonProps>((props, ref) => {
  const { classes } = useStyles();
  const selectedLayoutId = useCurrentLayoutSelector(selectedLayoutIdSelector);

  return (
    <IconButton
      {...props}
      ref={ref}
      className={classes.iconButton}
      disabled={selectedLayoutId == undefined}
      id="add-panel-button"
    >
      <SlideAdd24Regular />
    </IconButton>
  );
});

AddPanelIconButton.displayName = "AddPanelIconButton";

const selectedLayoutIdSelector = (state: LayoutState) => state.selectedLayout?.id;

export function AddPanelMenu(
  props: {
    handleClose: () => void;
  } & MenuProps,
): JSX.Element {
  const { anchorEl, handleClose, open } = props;
  const addPanel = useAddPanel();

  return (
    <Menu
      {...props}
      id="add-panel-menu"
      anchorEl={anchorEl}
      open={open}
      onClose={handleClose}
      MenuListProps={{
        "aria-labelledby": "add-panel-button",
      }}
    >
      <PanelList onPanelSelect={addPanel} />
    </Menu>
  );
}
