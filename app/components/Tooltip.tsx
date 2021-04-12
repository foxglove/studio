// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
//
// This file incorporates work covered by the following copyright and
// permission notice:
//
//   Copyright 2018-2021 Cruise LLC
//
//   This source code is licensed under the Apache License, Version 2.0,
//   found at http://www.apache.org/licenses/LICENSE-2.0
//   You may not use this file except in compliance with the License.

import {
  DirectionalHint,
  ICalloutProps,
  Tooltip as FluentTooltip,
  ITooltipHost,
  TooltipHost,
  useTheme,
  ICalloutContentStyles,
} from "@fluentui/react";
import { useCallback, useEffect, useRef } from "react";

type Contents = React.ReactNode | (() => React.ReactNode);

export type Props = {
  contents?: Contents;
  placement?: "top" | "left" | "right" | "bottom";

  // Show the tooltip automatically when mounted, for use in storybook.
  defaultShown?: boolean;
} & (
  | { children?: React.ReactElement; alwaysShown?: false; targetPosition?: never }
  | {
      children?: never;
      // Rather than showing the tooltip when children are hovered, present the tooltip immediately
      // from the targetPosition. Children must not be passed when alwaysShown is true. This is used
      // for components that need to customize tooltip position based on some mouse event they
      // listen to.
      alwaysShown: true;
      targetPosition: { x: number; y: number };
    }
);

export default function Tooltip({
  children,
  contents,
  placement = "top",
  defaultShown = false,
  targetPosition,
  alwaysShown = false,
}: Props): React.ReactElement | ReactNull {
  const onRenderContent = useCallback(
    () => (typeof contents === "function" ? contents() : contents ?? ReactNull),
    [contents],
  );
  const theme = useTheme();

  const tooltipHostRef = useRef<ITooltipHost>(ReactNull);
  const showOnMount = useRef(defaultShown);
  useEffect(() => {
    if (showOnMount.current) {
      tooltipHostRef.current?.show();
    }
  }, []);

  if (!contents) {
    return children ?? ReactNull;
  }

  // Styles which ideally we would be able to set in the theme for all Tooltips:
  // https://github.com/microsoft/fluentui/discussions/17772
  const calloutProps: ICalloutProps & { styles: Partial<ICalloutContentStyles> } = {
    beakWidth: 8,
    styles: {
      root: {
        color: theme.palette.black,
        selectors: { code: { backgroundColor: "transparent", padding: 0 } },
      },
      beak: { background: theme.palette.neutralDark },
      beakCurtain: { background: theme.palette.neutralDark },
      calloutMain: { background: theme.palette.neutralDark },
    },
  };

  if (targetPosition) {
    calloutProps.target = { left: targetPosition.x, top: targetPosition.y };
  }

  const directionalHint = {
    top: DirectionalHint.topCenter,
    left: DirectionalHint.leftCenter,
    right: DirectionalHint.rightCenter,
    bottom: DirectionalHint.bottomCenter,
  }[placement];

  if (alwaysShown) {
    if (React.Children.count(children) !== 0) {
      throw new Error("Tooltip cannot have alwaysShown=true and children");
    }
    // If the TooltipHost is not managing showing/hiding the tooltip, then the tooltip capturing
    // mouse events would get in the way of whatever component is managing it.
    calloutProps.styles.root = { pointerEvents: "none" };

    return (
      <FluentTooltip
        hidden={false}
        directionalHint={directionalHint}
        calloutProps={calloutProps}
        onRenderContent={onRenderContent}
        styles={{
          root: {
            // Appear immediately when shown
            animation: "none",
          },
        }}
      />
    );
  }
  return (
    <TooltipHost
      directionalHint={directionalHint}
      componentRef={tooltipHostRef}
      calloutProps={calloutProps}
      tooltipProps={{ onRenderContent }}
    >
      {children}
    </TooltipHost>
  );
}
