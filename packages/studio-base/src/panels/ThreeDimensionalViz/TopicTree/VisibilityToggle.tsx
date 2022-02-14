// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import BlockIcon from "@mui/icons-material/Block";
import { IconButton, SvgIcon, Tooltip, Theme } from "@mui/material";
import { createStyles, makeStyles } from "@mui/styles";
import cx from "classnames";
import { useCallback } from "react";

import { Color } from "@foxglove/regl-worldview";
import { defaultedRGBStringFromColorObj } from "@foxglove/studio-base/util/colorUtils";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    unavailable: {
      cursor: "not-allowed",
    },
    button: ({ overrideRGB, size }: StyleProps) => ({
      fontSize: size === "small" ? 10 : 12,
      color: `${overrideRGB ?? theme.palette.action.active} !important`,
      position: "relative",

      "&:hover, &:focus": {
        backgroundColor: theme.palette.action.hover,

        "& circle": {
          stroke: overrideRGB ?? theme.palette.info.main,
          strokeWidth: 4,
        },
      },
      "&:active": {
        color: theme.palette.info.main,
      },
    }),
    circle: ({ checked, visibleInScene }: StyleProps) => ({
      stroke: "currentColor",
      strokeWidth: 2,
      fill: checked ? "currentColor" : "none",
      fillOpacity: visibleInScene ? 0.8 : theme.palette.action.disabledOpacity,
    }),
  }),
);

export type VisibilityToggleProps = {
  available: boolean;
  checked: boolean;
  dataTest?: string;
  onAltToggle?: () => void;
  onShiftToggle?: () => void;
  onToggle: () => void;
  onMouseEnter?: (arg0: React.MouseEvent) => void;
  onMouseLeave?: (arg0: React.MouseEvent) => void;
  overrideColor?: Color;
  visibleInScene: boolean;
  size?: "small" | "normal";
};

type StyleProps = {
  checked: boolean;
  overrideRGB?: string;
  visibleInScene: boolean;
  size?: VisibilityToggleProps["size"];
};

// A toggle component that supports using tab key to focus and using space key to check/uncheck.
export default function VisibilityToggle(props: VisibilityToggleProps): JSX.Element {
  const {
    available,
    checked,
    dataTest,
    onAltToggle,
    onShiftToggle,
    onToggle,
    overrideColor,
    visibleInScene,
    onMouseEnter,
    onMouseLeave,
    size = "normal",
  } = props;
  const classes = useStyles({
    checked,
    overrideRGB: overrideColor ? defaultedRGBStringFromColorObj(overrideColor) : undefined,
    visibleInScene,
    size,
  });

  // Handle shift + click/enter, option + click/enter, and click/enter.
  const onChange = useCallback(
    (e: React.MouseEvent | React.KeyboardEvent) => {
      if (onShiftToggle && e.shiftKey) {
        onShiftToggle();
      } else if (onAltToggle && e.altKey) {
        onAltToggle();
      } else {
        onToggle();
      }
    },
    [onAltToggle, onShiftToggle, onToggle],
  );

  if (!available) {
    return (
      <Tooltip title="Unavailable" placement="top" arrow>
        <IconButton
          size="small"
          className={cx(classes.button, classes.unavailable)}
          data-test={dataTest}
        >
          <BlockIcon fontSize="inherit" color="inherit" />
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <IconButton
      size="small"
      className={classes.button}
      data-test={dataTest}
      tabIndex={0}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
          onChange(e);
        }
      }}
      onClick={onChange}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <SvgIcon fontSize="inherit">
        <circle className={classes.circle} cx={12} cy={12} r={10} />
      </SvgIcon>
    </IconButton>
  );
}
