// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import CheckIcon from "@mui/icons-material/Check";
import CopyAllIcon from "@mui/icons-material/CopyAll";
import { Button, IconButton, Tooltip, Typography } from "@mui/material";
import { useCallback, useState, PropsWithChildren } from "react";
import { makeStyles } from "tss-react/mui";

import clipboard from "@foxglove/studio-base/util/clipboard";

import { copyMessageReplacer } from "./copyMessageReplacer";

const useStyles = makeStyles()((theme) => ({
  button: {
    padding: theme.spacing(0.125),

    "&:hover": {
      backgroundColor: "transparent",
    },
  },
}));

export default function CopyMessageButton(
  props: PropsWithChildren<{ data: unknown }>,
): JSX.Element {
  const { children, data } = props;
  const { classes } = useStyles();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback((value: string) => {
    clipboard
      .copy(value)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch((err) => console.warn(err));
  }, []);

  if (children == undefined) {
    return (
      <Tooltip
        arrow
        title={copied ? "Copied" : "Copy entire message to clipboard"}
        placement="right"
      >
        <IconButton
          className={classes.button}
          size="small"
          onClick={() => handleCopy(JSON.stringify(data, copyMessageReplacer, 2) ?? "")}
          color={copied ? "success" : "primary"}
        >
          {copied ? <CheckIcon fontSize="small" /> : <CopyAllIcon fontSize="small" />}
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <Button
      size="small"
      color="inherit"
      className={classes.button}
      onClick={() => handleCopy(JSON.stringify(data, copyMessageReplacer, 2) ?? "")}
      startIcon={
        copied ? (
          <CheckIcon fontSize="small" color="success" />
        ) : (
          <CopyAllIcon fontSize="small" color="primary" />
        )
      }
    >
      <Typography color={copied ? "text.primary" : "primary"} variant="body2">
        {children}
      </Typography>
    </Button>
  );
}
