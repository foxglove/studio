// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { ClickAwayListener, Divider, Grow, MenuItem, Paper, Popper } from "@mui/material";
import { MouseEvent, useCallback, useContext, useState } from "react";
import { MosaicContext, MosaicNode, MosaicWindowContext } from "react-mosaic-component";
import { makeStyles } from "tss-react/mui";

import PanelContext from "@foxglove/studio-base/components/PanelContext";
import PanelList, { PanelSelection } from "@foxglove/studio-base/components/PanelList";
import { useCurrentLayoutActions } from "@foxglove/studio-base/context/CurrentLayoutContext";

const useStyles = makeStyles()((theme) => ({
  icon: {
    marginRight: theme.spacing(-1),
  },
  paper: {
    maxHeight: `calc(100vh - ${theme.spacing(12)})`,
    overflow: "auto",

    // Add iOS momentum scrolling for iOS < 13.0
    WebkitOverflowScrolling: "touch",
  },
  menuItem: {
    display: "flex",
    gap: theme.spacing(1),
    justifyContent: "space-between",

    "&.Mui-selected": {
      backgroundColor: theme.palette.action.focus,

      "&:hover": {
        backgroundColor: theme.palette.action.focus,
      },
    },
  },
}));

export default function ChangePanelMenuItem({ tabId }: { tabId?: string }): JSX.Element {
  const { classes } = useStyles();
  const panelContext = useContext(PanelContext);
  const { mosaicActions } = useContext(MosaicContext);
  const { mosaicWindowActions } = useContext(MosaicWindowContext);
  const { swapPanel } = useCurrentLayoutActions();

  const [anchorEl, setAnchorEl] = useState<undefined | HTMLElement>(undefined);
  const [overSubMenu, setOverSubMenu] = useState(false);
  const open = Boolean(anchorEl);

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    if (anchorEl !== event.currentTarget) {
      setAnchorEl(event.currentTarget);
    }
    setAnchorEl(undefined);
  };
  const handleMouseEnter = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = useCallback(() => {
    if (!overSubMenu) {
      setAnchorEl(undefined);
    }
  }, [overSubMenu]);

  const swap = useCallback(
    (id?: string) =>
      ({ type, config, relatedConfigs }: PanelSelection) => {
        // Reselecting current panel type is a no-op.
        if (type === panelContext?.type) {
          handleClose();
          return;
        }

        swapPanel({
          tabId,
          originalId: id ?? "",
          type,
          root: mosaicActions.getRoot() as MosaicNode<string>,
          path: mosaicWindowActions.getPath(),
          config: config ?? {},
          relatedConfigs,
        });
      },
    [handleClose, mosaicActions, mosaicWindowActions, panelContext?.type, swapPanel, tabId],
  );

  return (
    <>
      <MenuItem
        className={classes.menuItem}
        selected={open}
        id="change-panel-button"
        aria-controls={open ? "change-panel-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
      >
        Change Panel
        <ChevronRightIcon className={classes.icon} fontSize="small" />
      </MenuItem>
      <Divider variant="middle" />
      <Popper
        id="change-panel-menu"
        open={open}
        role={undefined}
        anchorEl={anchorEl}
        transition
        placement="right-start"
        style={{ zIndex: 10000 }}
        popperOptions={{
          modifiers: [
            {
              name: "flip",
              options: { fallbackPlacements: ["right-start", "left-start"] },
            },
          ],
        }}
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin: placement === "right-start" ? "top left" : "top right",
            }}
          >
            <Paper
              elevation={8}
              onMouseEnter={() => setOverSubMenu(true)}
              onMouseLeave={() => setOverSubMenu(false)}
              className={classes.paper}
            >
              <ClickAwayListener onClickAway={handleClose}>
                <PanelList
                  selectedPanelType={panelContext?.type}
                  onPanelSelect={swap(panelContext?.id)}
                />
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  );
}
