// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Portal } from "@mui/material";
import { PropsWithChildren } from "react";
import { Tooltip as ReactTooltip, PlacesType } from "react-tooltip";
import tc from "tinycolor2";
import { makeStyles } from "tss-react/mui";

type Props = {
  id: string;
  isOpen?: boolean;
  placement?: PlacesType;
  className?: string;
  classNameArrow?: string;
};

const useStyles = makeStyles()((theme) => ({
  tooltip: {
    "&[role='tooltip']": {
      backgroundColor: tc(theme.palette.grey[700]).setAlpha(0.92).toString(),
      borderRadius: theme.shape.borderRadius,
      backdropFilter: "blur(3px)",
      fontWeight: "normal",
      padding: theme.spacing(0.5, 1),
      fontSize: theme.typography.caption.fontSize,
    },
  },
  arrow: {
    clipPath: "polygon(100% 0, 0% 100%, 100% 100%)",
  },
}));

export function Tooltip(props: PropsWithChildren<Props>): JSX.Element {
  const { classes, cx } = useStyles();
  return (
    <Portal>
      <ReactTooltip
        {...props}
        closeEvents={{
          mouseleave: true,
          click: true,
          blur: true,
        }}
        place={props.placement ?? "bottom"}
        className={cx(classes.tooltip, props.className)}
        classNameArrow={cx(classes.arrow, props.classNameArrow)}
      />
    </Portal>
  );
}
