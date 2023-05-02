// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Dismiss20Filled } from "@fluentui/react-icons";
import {
  Button,
  Chip,
  ClickAwayListener,
  IconButton,
  Popover,
  Slide,
  SlideProps,
  Typography,
} from "@mui/material";
import { useTour } from "@reactour/tour";
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

type Props = {
  onClose: () => void;
  open: boolean;
};

export function UITourPopover(props: Props): JSX.Element {
  const { open, onClose } = props;

  const { classes } = useStyles();
  const { setIsOpen: setTourOpen } = useTour();

  const [_, setEnabled] = useAppConfigurationValue<boolean>(AppSetting.ENABLE_NEW_TOPNAV);

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
      <ClickAwayListener onClickAway={() => onClose()}>
        <Stack padding={2} gap={0.5}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            paddingBottom={0.5}
          >
            <Chip label="BETA" size="small" color="info" variant="outlined" />
            <IconButton size="small" className={classes.dismissIcon} onClick={() => onClose()}>
              <Dismiss20Filled />
            </IconButton>
          </Stack>
          <Typography variant="h5" fontWeight={500}>
            Try our new user experience
          </Typography>
          <Typography variant="body2">
            We&apos;ve redesigned our navigation to make Studio faster and easier to use.
          </Typography>

          <Stack direction="row-reverse" gap={1} paddingTop={3}>
            <Button
              size="small"
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
