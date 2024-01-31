// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Tooltip as MuiTooltip, TooltipProps } from "@mui/material";
import { MouseEvent, useCallback, useMemo } from "react";

/**
 * Tooltip wraps a MUI tooltip to close the tooltip when the child component is clicked. MUI tooltip does not have this feature.
 * tooltip `onClick` which the MUI Tooltip does not support.
 */

export function Tooltip(props: TooltipProps): JSX.Element {
  const { children, ...rest } = props;
  const [open, setOpen] = React.useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleChildClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      handleClose();
      children.props.onClick?.(event);
    },
    [children.props],
  );

  const clonedChildren = useMemo(
    () => React.cloneElement(children, { onClick: handleChildClick }),
    [children, handleChildClick],
  );

  return (
    <MuiTooltip {...rest} open={open} onOpen={handleOpen} onClose={handleClose}>
      {clonedChildren}
    </MuiTooltip>
  );
}
