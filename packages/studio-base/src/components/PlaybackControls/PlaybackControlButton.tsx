// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Tooltip, TooltipProps } from "@mui/material";
import { MouseEvent, useState } from "react";

import HoverableIconButton, {
  HoverableIconButtonProps,
} from "@foxglove/studio-base/components/HoverableIconButton";

type Props = {
  title: TooltipProps["title"];
} & HoverableIconButtonProps;

export function PlaybackControlButton(props: Props): JSX.Element {
  const { title, onClick, ...rest } = props;
  const [open, setOpen] = useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    handleClose();
    onClick?.(event);
  };

  return (
    <Tooltip
      arrow={false}
      title={title}
      open={open}
      disableHoverListener
      onMouseEnter={handleOpen}
      onMouseLeave={handleClose}
    >
      <HoverableIconButton {...rest} onClick={handleClick} />
    </Tooltip>
  );
}
