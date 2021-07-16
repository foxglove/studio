// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Text, makeStyles } from "@fluentui/react";
import clsx from "clsx";
import { useState } from "react";

import { PanelExtensionContext } from "@foxglove/studio";

const useStyles = makeStyles(({ semanticColors, spacing }) => ({
  root: {
    backgroundColor: semanticColors.bodyBackground,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    userSelect: "none",
    width: "100%",
    height: "100%",
    padding: spacing.m,
  },
  control: {
    maxHeight: "100%",
    maxWidth: "100%",
  },
}));

const useButtonStyles = makeStyles(({ semanticColors }) => ({
  background: {
    cursor: "pointer",
    fill: semanticColors.bodyBackgroundHovered,
    stroke: semanticColors.buttonBorder,
    strokeWidth: 0.5,

    ":hover": {
      fill: semanticColors.bodyBackgroundChecked,

      "+ path": {
        fill: semanticColors.buttonTextHovered,
      },
    },
  },
  backgroundDisabled: {
    cursor: "auto",
    strokeWidth: 0,

    ":hover": {
      fill: semanticColors.bodyBackgroundHovered,

      "+ path": {
        fill: semanticColors.bodyBackground,
      },
    },
  },
  backgroundPressed: {
    fill: `${semanticColors.primaryButtonBackground} !important`,
    stroke: `${semanticColors.primaryButtonBackgroundPressed} !important`,

    ":hover": {
      "+ path": {
        fill: semanticColors.buttonTextHovered,
      },
    },
  },
  text: {
    pointerEvents: "none",
    fill: semanticColors.buttonText,
  },
  textDisabled: {
    fill: semanticColors.bodyBackground,
  },
}));

const useStopButtonStyles = makeStyles(({ fonts, semanticColors }) => ({
  background: {
    cursor: "pointer",
    fill: semanticColors.errorBackground,
    stroke: semanticColors.errorText,
    strokeWidth: 0.5,

    ":hover": {
      stroke: semanticColors.buttonText,

      "+ text": {
        fill: semanticColors.buttonText,
      },
    },
  },
  backgroundDisabled: {
    cursor: "auto !important",
    opacity: 0.4,
    stroke: semanticColors.errorBackground,

    ":hover": {
      stroke: `${semanticColors.errorBackground} !important`,
    },
  },
  text: {
    ...fonts.xxLarge,
    pointerEvents: "none",
    fill: semanticColors.errorText,
  },
  textDisabled: {
    fill: `${semanticColors.bodyBackground} !important`,
  },
}));

type JoystickPanelProps = {
  context: PanelExtensionContext;
  disableStop?: boolean;
  disableX?: boolean;
  disableY?: boolean;
  stopText?: string;
  title?: string;
};

function JoystickPanel({
  disableStop = false,
  disableX = false,
  disableY = false,
  stopText = "STOP",
  title,
}: JoystickPanelProps): JSX.Element {
  // FIXME: Keyboard shortcut mappings
  // FIXME: Send commands back to ROS

  const classes = useStyles();
  const buttonClasses = useButtonStyles();
  const stopButtonClasses = useStopButtonStyles();
  const [state, setState] = useState({
    up: false,
    down: false,
    left: false,
    right: false,
    active: false,
  });

  const handleStop = () => {
    if (!state.active) {
      return setState(state);
    }

    return setState({
      ...state,
      active: false,
    });
  };
  const handleMouseDown = (value: string) => {
    setState({ ...state, active: true, [value]: true });
  };
  const handleMouseUp = (value: string) => {
    setState({ ...state, [value]: false });
  };
  const handleClick = (value: string) => ({
    onMouseDown: () => handleMouseDown(value),
    onMouseUp: () => handleMouseUp(value),
    onMouseLeave: () => handleMouseUp(value),
  });

  return (
    <div className={classes.root}>
      <Text>{title}</Text>

      <svg className={classes.control} viewBox="0 0 256 256">
        <g opacity={disableY ? 0.5 : 1}>
          {/* UP button */}
          <g {...(!disableY && handleClick("up"))} role="button">
            <path
              className={clsx(buttonClasses.background, {
                [buttonClasses.backgroundDisabled]: disableY,
                [buttonClasses.backgroundPressed]: state.up,
              })}
              d="M162.707,78.945c-20.74,-14.771 -48.795,-14.771 -69.535,-0l-42.723,-42.723c44.594,-37.791 110.372,-37.794 154.981,-0l-42.723,42.723Z"
            />
            <path
              className={clsx(buttonClasses.text, {
                [buttonClasses.textDisabled]: disableY,
              })}
              d="M128,30.364l20,20l-40,-0l20,-20Z"
            />
          </g>

          {/* DOWN button */}
          <g {...(!disableY && handleClick("down"))} role="button">
            <path
              className={clsx(buttonClasses.background, {
                [buttonClasses.backgroundDisabled]: disableY,
                [buttonClasses.backgroundPressed]: state.down,
              })}
              d="M93.172,176.764c20.74,14.771 48.795,14.771 69.535,0l42.723,42.723c-44.594,37.791 -110.372,37.794 -154.981,0l42.723,-42.723Z"
            />
            <path
              className={clsx(buttonClasses.text, {
                [buttonClasses.textDisabled]: disableY,
              })}
              d="M128,225.345l-20,-20l40,0l-20,20Z"
            />
          </g>
        </g>

        <g opacity={disableX ? 0.5 : 1}>
          {/* LEFT button */}
          <g {...(!disableX && handleClick("left"))} role="button">
            <path
              className={clsx(buttonClasses.background, {
                [buttonClasses.backgroundDisabled]: disableX,
                [buttonClasses.backgroundPressed]: state.left,
              })}
              d="M36.307,205.345c-37.793,-44.609 -37.791,-110.387 -0,-154.981l42.723,42.723c-14.771,20.74 -14.771,48.795 -0,69.535l-42.723,42.723Z"
            />
            <path
              className={clsx(buttonClasses.text, {
                [buttonClasses.textDisabled]: disableX,
              })}
              d="M30.449,127.854l20,-20l0,40l-20,-20Z"
            />
          </g>

          {/* RIGHT button */}
          <g {...(!disableX && handleClick("right"))} role="button">
            <path
              className={clsx(buttonClasses.background, {
                [buttonClasses.backgroundDisabled]: disableX,
                [buttonClasses.backgroundPressed]: state.right,
              })}
              d="M219.572,50.364c37.794,44.609 37.791,110.387 0.001,154.981l-42.724,-42.723c14.771,-20.74 14.771,-48.795 0,-69.535l42.723,-42.723Z"
            />
            <path
              className={clsx(buttonClasses.text, {
                [buttonClasses.textDisabled]: disableX,
              })}
              d="M225.43,127.854l-20,20l0,-40l20,20Z"
            />
          </g>
        </g>

        {/* STOP button */}
        {!disableStop && (
          <g onClick={handleStop} role="button">
            <circle
              className={clsx(stopButtonClasses.background, {
                [stopButtonClasses.backgroundDisabled]: !state.active,
              })}
              cx="128"
              cy="128"
              r="45"
            />
            <text
              x={128}
              dy={12}
              y={128}
              textAnchor="middle"
              className={clsx(stopButtonClasses.text, {
                [stopButtonClasses.textDisabled]: !state.active,
              })}
            >
              <tspan>{stopText}</tspan>
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

export default JoystickPanel;
