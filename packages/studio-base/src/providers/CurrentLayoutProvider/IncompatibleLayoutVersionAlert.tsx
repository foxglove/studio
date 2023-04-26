// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Link,
} from "@mui/material";

type Props = {
  onClose: () => void;
};

export function IncompatibleLayoutVersionAlert(props: Props): JSX.Element {
  const { onClose } = props;

  return (
    <Dialog open onClose={onClose}>
      <DialogTitle>Incompatible layout version</DialogTitle>
      <DialogContent>
        <DialogContentText>
          This layout was created with a newer version of Foxglove Studio. Please update to the{" "}
          <Link target="_blank" href="https://foxglove.dev/download">
            latest version
          </Link>
          .
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
}
