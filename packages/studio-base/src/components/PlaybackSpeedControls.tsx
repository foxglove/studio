// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import CheckIcon from "@mui/icons-material/Check";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Button, ListItemIcon, ListItemText, Menu, MenuItem } from "@mui/material";
import { useCallback, useEffect } from "react";

import { useMessagePipeline } from "@foxglove/studio-base/components/MessagePipeline";
import {
  LayoutState,
  useCurrentLayoutActions,
  useCurrentLayoutSelector,
} from "@foxglove/studio-base/context/CurrentLayoutContext";

const SPEED_OPTIONS = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 0.8, 1, 2, 3, 5];

const formatSpeed = (val: number) => `${val < 0.1 ? val.toFixed(2) : val}×`;

const configSpeedSelector = (state: LayoutState) =>
  state.selectedLayout?.data?.playbackConfig.speed;

export default function PlaybackSpeedControls(): JSX.Element {
  const [anchorEl, setAnchorEl] = React.useState<undefined | HTMLElement>(undefined);
  const open = Boolean(anchorEl);
  const configSpeed = useCurrentLayoutSelector(configSpeedSelector);
  const speed = useMessagePipeline(
    useCallback(({ playerState }) => playerState.activeData?.speed, []),
  );
  const setPlaybackSpeed = useMessagePipeline(useCallback((state) => state.setPlaybackSpeed, []));
  const { setPlaybackConfig } = useCurrentLayoutActions();
  const setSpeed = useCallback(
    (newSpeed: number) => {
      setPlaybackConfig({ speed: newSpeed });
      setPlaybackSpeed?.(newSpeed);
    },
    [setPlaybackConfig, setPlaybackSpeed],
  );

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(undefined);
  };

  // Set the speed to the speed that we got from the config whenever we get a new Player.
  useEffect(() => {
    if (configSpeed != undefined) {
      setPlaybackSpeed?.(configSpeed);
    }
  }, [configSpeed, setPlaybackSpeed]);

  const displayedSpeed = speed ?? configSpeed;

  return (
    <>
      <Button
        id="playback-speed-button"
        aria-controls={open ? "playback-speed-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleClick}
        data-test="PlaybackSpeedControls-Dropdown"
        disabled={setPlaybackSpeed == undefined}
        disableRipple
        variant="contained"
        color="inherit"
        endIcon={<ExpandMoreIcon />}
      >
        {displayedSpeed == undefined ? "–" : formatSpeed(displayedSpeed)}
      </Button>
      <Menu
        id="playback-speed-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          "aria-labelledby": "basic-button",
        }}
        anchorOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
      >
        {SPEED_OPTIONS.map((option) => (
          <MenuItem
            selected={displayedSpeed === option}
            key={option}
            onClick={() => {
              setSpeed(option);
              handleClose();
            }}
          >
            {displayedSpeed === option && (
              <ListItemIcon>
                <CheckIcon />
              </ListItemIcon>
            )}
            <ListItemText inset={displayedSpeed !== option}>{formatSpeed(option)}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
