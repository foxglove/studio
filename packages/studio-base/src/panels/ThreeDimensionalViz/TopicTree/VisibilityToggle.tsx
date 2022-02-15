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
    button: ({ overrideRGB }: StyleProps) => ({
      fontSize: `10px !important`,
      color: `${theme.palette.text.secondary} !important`,
      position: "relative",

      "&.Mui-focusVisible": {
        backgroundColor: theme.palette.text.secondary,
        color: theme.palette.info.main,
      },
      "&:hover, &.Mui-focusVisible": {
        backgroundColor: "transparent",

        "& circle": {
          stroke: overrideRGB ?? theme.palette.info.main,
          strokeWidth: 5,
        },
        "& .MuiTouchRipple-child": {
          backgroundColor: theme.palette.action.focus,
        },
      },
    }),
    circle: ({ checked, overrideRGB, visibleInScene }: StyleProps) => ({
      color: overrideRGB ?? "currentcolor",
      stroke: "currentcolor",
      strokeWidth: 2,
      fill: "currentcolor",
      fillOpacity: checked ? (visibleInScene ? 1 : theme.palette.action.disabledOpacity) : 0,
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
};

type StyleProps = {
  checked: boolean;
  overrideRGB?: string;
  visibleInScene: boolean;
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
  } = props;
  const overrideRGB = overrideColor ? defaultedRGBStringFromColorObj(overrideColor) : undefined;

  const classes = useStyles({
    checked,
    overrideRGB,
    visibleInScene,
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
