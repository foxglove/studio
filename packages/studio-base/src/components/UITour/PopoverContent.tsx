// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Dismiss20Filled } from "@fluentui/react-icons";
import { Paper, IconButton, Button, Typography } from "@mui/material";
import { PopoverContentProps } from "@reactour/tour";
import { makeStyles } from "tss-react/mui";

import Stack from "@foxglove/studio-base/components/Stack";

const useStyles = makeStyles()((theme) => ({
  paper: {
    position: "relative",
    borderRadius: 8,
    backgroundColor: theme.palette.background.menu,
  },
  closeButton: {
    position: "absolute",
    top: 0,
    right: 0,
    margin: theme.spacing(1.5),
  },
}));

export function PopoverContent(props: PopoverContentProps): JSX.Element {
  const {
    onClickClose,
    currentStep,
    disabledActions,
    meta,
    setCurrentStep,
    setIsOpen,
    setMeta,
    setSteps,
    steps,
  } = props;
  const { classes } = useStyles();

  const step = steps[currentStep];

  const handleClose = () => {
    if (disabledActions !== true) {
      onClickClose?.({
        setCurrentStep,
        setIsOpen,
        currentStep,
        steps,
        meta,
        setMeta,
        setSteps,
      });
    }
  };

  const handleNext = () => {
    setCurrentStep(currentStep + 1);
  };
  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  return (
    <Paper variant="elevation" className={classes.paper}>
      <IconButton size="small" className={classes.closeButton} onClick={handleClose}>
        <Dismiss20Filled />
      </IconButton>
      <div>{step?.content}</div>
      <Stack direction="row-reverse" padding={2} alignItems="center" justifyContent="space-between">
        <Stack direction="row-reverse" gap={1}>
          {currentStep !== steps.length - 1 ? (
            <Button variant="contained" onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button variant="contained" onClick={handleClose}>
              Done
            </Button>
          )}
          {currentStep !== 0 && <Button onClick={handleBack}>Back</Button>}
        </Stack>
        <Typography variant="button" color="primary">
          {currentStep + 1} of {steps.length}
        </Typography>
      </Stack>
    </Paper>
  );
}
