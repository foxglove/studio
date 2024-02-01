// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { IconButton, IconButtonProps } from "@mui/material";
import { forwardRef, useCallback, useEffect, useState } from "react";
import { makeStyles } from "tss-react/mui";

type Props = {
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
  color?: IconButtonProps["color"];
  activeColor?: IconButtonProps["color"];
} & Omit<IconButtonProps, "children" | "color">;

const useStyles = makeStyles()(() => ({
  root: {
    svg: { pointerEvents: "none" },
  },
}));

const HoverableIconButton = forwardRef<HTMLButtonElement, Props>((props, ref) => {
  const {
    icon,
    activeIcon = icon,
    className,
    color,
    activeColor,
    onMouseLeave,
    onMouseEnter,
    ...rest
  } = props;
  const { classes, cx } = useStyles();
  const [hovered, setHovered] = useState(false);

  const handleMouseEnter = useCallback(
    (event) => {
      if (onMouseEnter != undefined) {
        onMouseEnter(event);
      }
      if (props.disabled === true) {
        return;
      }
      setHovered(true);
    },
    [onMouseEnter, props.disabled],
  );

  const handleMouseLeave = useCallback(
    (event) => {
      if (onMouseLeave != undefined) {
        onMouseLeave(event);
      }
      setHovered(false);
    },
    [onMouseLeave],
  );

  useEffect(() => {
    if (props.disabled === true) {
      setHovered(false);
    }
  }, [props.disabled]);

  const iconComponent = hovered ? activeIcon : icon;

  return (
    <IconButton
      ref={ref}
      {...rest}
      className={cx(classes.root, className)}
      component="button"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      color={activeColor != undefined ? (hovered ? activeColor : color) : color}
    >
      {iconComponent}
    </IconButton>
  );
});

HoverableIconButton.displayName = "HoverableIconButton";

export default HoverableIconButton;
