// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Dismiss20Filled } from "@fluentui/react-icons";
import {
  Button,
  Popover,
  Typography,
  Chip,
  IconButton,
  ClickAwayListener,
  Slide,
  SlideProps,
} from "@mui/material";
import { useTour } from "@reactour/tour";
import { useState } from "react";
import { makeStyles } from "tss-react/mui";

import { AppSetting } from "@foxglove/studio-base/AppSetting";
import Stack from "@foxglove/studio-base/components/Stack";
import { useAppConfigurationValue } from "@foxglove/studio-base/hooks";

const useStyles = makeStyles()((theme) => ({
  paper: {
    width: 320,
    borderRadius: 8,
    backgroundColor: theme.palette.background.menu,
  },
  dismissIcon: {
    marginRight: theme.spacing(-0.5),
  },
}));

export function UITourPopover(): JSX.Element {
  const { classes } = useStyles();
  const { setIsOpen: setTourOpen } = useTour();

  const [_, setEnabled] = useAppConfigurationValue<boolean>(AppSetting.ENABLE_NEW_TOPNAV);

  const [open, setOpen] = useState(true);

  return (
    <Popover
      open={open}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      marginThreshold={16}
      PaperProps={{ className: classes.paper, square: false }}
      TransitionComponent={Slide}
      TransitionProps={{ direction: "up", timeout: 500 } as Partial<SlideProps>}
    >
      <ClickAwayListener onClickAway={() => setOpen(false)}>
        <Stack padding={2} gap={1}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Chip label="BETA" size="small" color="info" variant="outlined" />
            <IconButton size="small" className={classes.dismissIcon} onClick={() => setOpen(false)}>
              <Dismiss20Filled />
            </IconButton>
          </Stack>
          <Typography variant="h5" fontWeight={500}>
            Try our new user experience
          </Typography>
          <Typography>
            We&apos;ve redesigned our navigation to make Studio faster and easier to use.
          </Typography>

          <Stack direction="row-reverse" gap={1} paddingTop={4}>
            <Button
              variant="contained"
              onClick={async () => {
                await setEnabled(true);
                setTourOpen(true);
              }}
            >
              Try it now
            </Button>
            <Button>Read more</Button>
          </Stack>
        </Stack>
      </ClickAwayListener>
    </Popover>
  );
}
