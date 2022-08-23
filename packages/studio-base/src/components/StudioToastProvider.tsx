// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Grow } from "@mui/material";
import { SnackbarProvider } from "notistack";
import { PropsWithChildren } from "react";

export default function StudioToastProvider(props: PropsWithChildren<unknown>): JSX.Element {
  return (
    <SnackbarProvider
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      maxSnack={4}
      TransitionComponent={Grow}
    >
      {props.children}
    </SnackbarProvider>
  );
}
