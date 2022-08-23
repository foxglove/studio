// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Grow } from "@mui/material";
import { SnackbarProvider } from "notistack";
import { PropsWithChildren } from "react";
import { makeStyles } from "tss-react/mui";

const useStyles = makeStyles()((theme) => ({
  /* eslint-disable tss-unused-classes/unused-classes */
  root: {
    ".SnackbarContent-root": {
      padding: theme.spacing(0.5, 1.5),
    },
  },
  variantSuccess: {
    "&.SnackbarContent-root": {
      backgroundColor: theme.palette.success.main,
      color: theme.palette.success.contrastText,
    },
  },
  variantError: {
    "&.SnackbarContent-root": {
      backgroundColor: theme.palette.error.main,
      color: theme.palette.error.contrastText,
    },
  },
  variantInfo: {
    "&.SnackbarContent-root": {
      backgroundColor: theme.palette.info.main,
      color: theme.palette.info.contrastText,
    },
  },
  variantWarning: {
    "&.SnackbarContent-root": {
      backgroundColor: theme.palette.warning.main,
      color: theme.palette.warning.contrastText,
    },
  },
  /* eslint-enable tss-unused-classes/unused-classes */
}));

export default function StudioToastProvider(props: PropsWithChildren<unknown>): JSX.Element {
  const { classes } = useStyles();
  return (
    <SnackbarProvider
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      maxSnack={4}
      TransitionComponent={Grow}
      classes={classes}
    >
      {props.children}
    </SnackbarProvider>
  );
}
