// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Tooltip as MuiTooltip, TooltipProps } from "@mui/material";
import { MouseEvent, useCallback, useMemo, useState } from "react";

/**
 * This component exists as result of a team preference to close the
 * tooltip `onClick` which the MUI Tooltip does not support.
 */

export function Tooltip(props: TooltipProps): JSX.Element {
  const { children, ...rest } = props;
  const [open, setOpen] = useState(false);

  const handleMouseEnter = () => {
    setOpen(true);
  };

  const handleMouseLeave = () => {
    setOpen(false);
  };

  const handleChildClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      setOpen(false);
      children.props.onClick?.(event);
    },
    [children.props],
  );

  const clonedChildren = useMemo(
    () => React.cloneElement(children, { onClick: handleChildClick }),
    [children, handleChildClick],
  );

  return (
    <MuiTooltip
      {...rest}
      open={open}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      disableHoverListener
    >
      {clonedChildren}
    </MuiTooltip>
  );
}
