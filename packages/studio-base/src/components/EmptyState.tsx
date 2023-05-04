// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Container, Typography } from "@mui/material";
import { ReactNode } from "react";
import { makeStyles } from "tss-react/mui";

import Stack from "@foxglove/studio-base/components/Stack";

const useStyles = makeStyles()((theme) => ({
  root: {
    code: {
      color: theme.palette.primary.main,
      background: "transparent",
      padding: 0,
    },
  },
}));

export default function EmptyState({ children }: { children: ReactNode }): JSX.Element {
  const { classes } = useStyles();

  return (
    <Stack
      className={classes.root}
      flex="auto"
      alignItems="center"
      justifyContent="center"
      fullHeight
    >
      <Container maxWidth={false}>
        <Typography variant="body2" color="text.secondary" lineHeight={1.4} align="center">
          {children}
        </Typography>
      </Container>
    </Stack>
  );
}
