// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import CheckIcon from "@mui/icons-material/Check";
import { Button, ListItemIcon, ListItemText, Menu, MenuItem } from "@mui/material";
import { useCallback, useState } from "react";
import { makeStyles } from "tss-react/mui";

import {
  WorkspaceContextStore,
  useWorkspaceStore,
} from "@foxglove/studio-base/context/Workspace/WorkspaceContext";
import { useWorkspaceActions } from "@foxglove/studio-base/context/Workspace/useWorkspaceActions";
import { PlaybackConfig } from "@foxglove/studio-base/types/Workspace";

const SPEED_OPTIONS: PlaybackConfig["speed"][] = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 0.8, 1, 2, 3, 5];

const formatSpeed = (val: PlaybackConfig["speed"]) => `${val < 0.1 ? val.toFixed(2) : val}×`;

const selectPlaybackSpeed = (store: WorkspaceContextStore) => store.playbackControls.speed;

const useStyles = makeStyles()((theme) => ({
  button: {
    padding: theme.spacing(0.625, 0.5),
    backgroundColor: "transparent",

    ":hover": {
      backgroundColor: theme.palette.action.hover,
    },
  },
}));

export default function PlaybackSpeedControls(props: { disabled?: boolean }): JSX.Element {
  const { classes } = useStyles();
  const [anchorEl, setAnchorEl] = useState<undefined | HTMLElement>(undefined);
  const open = Boolean(anchorEl);
  const speed = useWorkspaceStore(selectPlaybackSpeed);

  // Speed setting lives on the Workspace/persists accross layouts
  const {
    playbackControlActions: { setSpeed },
  } = useWorkspaceActions();

  const assignSpeed = useCallback(
    (val: PlaybackConfig["speed"]) => {
      setSpeed(val);
    },
    [setSpeed],
  );

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(undefined);
  };

  return (
    <>
      <Button
        className={classes.button}
        id="playback-speed-button"
        aria-controls={open ? "playback-speed-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleClick}
        data-testid="PlaybackSpeedControls-Dropdown"
        disabled={props.disabled}
        disableRipple
        variant="contained"
        color="inherit"
        endIcon={<ArrowDropDownIcon />}
      >
        {/* This check is relevant in some stories where it's unecessary to bring in the Workspace context. */}
        {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */}
        {speed == undefined ? "–" : formatSpeed(speed)}
      </Button>
      <Menu
        id="playback-speed-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          "aria-labelledby": "playback-speed-button",
          dense: true,
        }}
        anchorOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
      >
        {SPEED_OPTIONS.map((option) => (
          <MenuItem
            selected={speed === option}
            key={option}
            onClick={() => {
              assignSpeed(option);
              handleClose();
            }}
          >
            {speed === option && (
              <ListItemIcon>
                <CheckIcon fontSize="small" />
              </ListItemIcon>
            )}
            <ListItemText
              inset={speed !== option}
              primary={formatSpeed(option)}
              primaryTypographyProps={{ variant: "inherit" }}
            />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
