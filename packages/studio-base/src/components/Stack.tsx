// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { generateUtilityClass, unstable_composeClasses as composeClasses } from "@mui/base";
import { styled as muiStyled, Theme, useTheme } from "@mui/material";
import cx from "classnames";
import { ElementType, PropsWithChildren } from "react";

function getStackUtilityClass(slot: string): string {
  return generateUtilityClass("FoxgloveStack", slot);
}

const StackRoot = muiStyled("div", {
  name: "FoxgloveStack",
  slot: "Root",
  overridesResolver: (_props, styles) => {
    return [styles.root];
  },
})(({ theme, ownerState }: { theme: Theme; ownerState: StackProps }) => ({
  display: "flex",
  flexDirection: ownerState.direction,
  flexWrap: ownerState.wrap,
  justifyContent: ownerState.justifyContent,
  alignItems: ownerState.alignItems,
  alignContent: ownerState.alignContent,
  alignSelf: ownerState.alignSelf,
  gap: typeof ownerState.gap === "number" ? theme.spacing(ownerState.gap) : ownerState.gap,
  padding:
    typeof ownerState.padding === "number" ? theme.spacing(ownerState.padding) : ownerState.padding,
  flex: typeof ownerState.flex === "number" ? ownerState.flex : ownerState.flex,

  ...(ownerState.fullHeight === true && {
    height: "100%",
  }),
}));

export default function Stack(props: PropsWithChildren<StackProps>): JSX.Element {
  const theme = useTheme();

  const {
    alignItems,
    alignSelf,
    className,
    component = "div",
    direction = "column",
    flex,
    flexBasis,
    flexGrow,
    flexShrink,
    fullHeight = false,
    gap,
    justifyContent,
    padding,
    wrap,
    style,
    ...other
  } = props;

  const ownerState = {
    ...props,
    alignItems,
    alignSelf,
    direction,
    flex,
    flexBasis,
    flexGrow,
    flexShrink,
    fullHeight,
    gap,
    justifyContent,
    padding,
    wrap,
  };

  const classes = composeClasses({ root: ["root"] }, getStackUtilityClass, ownerState.classes);

  return (
    <StackRoot
      as={component}
      className={cx(classes.root, className)}
      ownerState={ownerState}
      theme={theme}
      style={style}
      {...other}
    />
  );
}

export type StackProps = {
  /**
   * Override or extend the styles applied to the component.
   */
  classes?: {
    root: string;
  };

  /**
   * @ignore
   */
  className?: string;

  /**
   * The component used for the root node.
   * Either a string to use a HTML element or a component.
   */
  component?: ElementType;

  /**
   * Defines the `flex-direction` style property.
   * @default 'column'
   */
  direction?: "column" | "column-reverse" | "row-reverse" | "row";

  /**
   * Make stack 100% height.
   */
  fullHeight?: boolean;

  /**
   * Defines the `flex-wrap` style property.
   */
  wrap?: "nowrap" | "wrap" | "wrap-reverse";

  /**
   * Defines the `justify-content` style property.
   */
  justifyContent?:
    | "flex-start"
    | "flex-end"
    | "center"
    | "space-between"
    | "space-around"
    | "space-evenly"
    | "start"
    | "end"
    | "left"
    | "right";

  /**
   * Defines the `align-items` style property.
   */
  alignItems?:
    | "stretch"
    | "flex-start"
    | "flex-end"
    | "center"
    | "baseline"
    | "first baseline"
    | "last baseline"
    | "start"
    | "end"
    | "self-start"
    | "self-end";

  /**
   * Defines the `align-content` style property.
   */
  alignContent?:
    | "flex-start"
    | "flex-end"
    | "center"
    | "space-between"
    | "space-around"
    | "space-evenly"
    | "stretch"
    | "start"
    | "end"
    | "baseline"
    | "first baseline"
    | "last baseline";

  /**
   * Defines the `align-self` style property.
   */
  alignSelf?: "auto" | "flex-start" | "flex-end" | "center" | "baseline" | "stretch";

  /**
   * Defines the `gap` style property.
   */
  gap?: number | string;

  /**
   * Defines the `padding` style property.
   */
  padding?: number | string;

  /**
   * Defines the `flex` style property.
   */
  flex?: number | string;

  /**
   * Defines the `flex-grow` style property.
   */
  flexGrow?: number;

  /**
   * Defines the `flex-shrink` style property.
   */
  flexShrink?: number;

  /**
   * Defines the `flex-basis` style property.
   */
  flexBasis?: number | string;

  /**
   * CSS styles to apply to the component.
   */
  style?: React.CSSProperties;
};
