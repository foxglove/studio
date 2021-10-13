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

import { IButtonStyles, IconButton, mergeStyleSets, Stack, useTheme } from "@fluentui/react";
import cx from "classnames";
import { ReactElement } from "react";

import Button from "@foxglove/studio-base/components/Button";
import Flex from "@foxglove/studio-base/components/Flex";
import { useTooltip } from "@foxglove/studio-base/components/Tooltip";
import { colors } from "@foxglove/studio-base/util/sharedStyleConstants";

const PANE_WIDTH = 268;
const PANE_HEIGHT = 240;

const classes = mergeStyleSets({
  tab: {
    margin: "0",
    paddingLeft: "8px !important",
    paddingRight: "8px !important",
    backgroundColor: "transparent !important",
    border: "none !important",
    borderRadius: "0 !important",
    borderTop: "2px solid transparent !important",
    borderBottom: "2px solid transparent !important",
  },
  tabSelected: {
    borderBottom: `2px solid ${colors.TEXT_NORMAL} !important`,
  },
  fixedSizePane: {
    height: PANE_HEIGHT,
    width: PANE_WIDTH - 28,
    overflow: "hidden auto",
    padding: "8px 0",
  },
  tabBar: {
    justifyContent: "space-between",
  },
  tabBody: {
    backgroundColor: colors.DARK1,
    padding: "4px 12px 12px 12px",
  },
});

export function ToolGroup<T>({ children }: { name: T; children: React.ReactElement }): JSX.Element {
  return children;
}

export function ToolGroupFixedSizePane({
  children,
}: {
  children: React.ReactElement | React.ReactElement[];
}): JSX.Element {
  return <div className={classes.fixedSizePane}>{children}</div>;
}

type Props<T extends string> = {
  checked?: boolean;
  children: React.ReactElement<typeof ToolGroup>[] | React.ReactElement<typeof ToolGroup>;
  iconName: RegisteredIconNames;
  onSelectTab: (name: T | undefined) => void;
  selectedTab?: T; // collapse the toolbar if selectedTab is undefined
  tooltip: string;
  style?: React.CSSProperties;
  dataTest?: string;
};

const iconStyles = {
  iconChecked: { color: colors.ACCENT },
  icon: {
    color: "white",

    svg: {
      fill: "currentColor",
      height: "1em",
      width: "1em",
    },
  },
} as Partial<IButtonStyles>;

export default function ExpandingToolbar<T extends string>({
  children,
  checked,
  iconName,
  onSelectTab,
  selectedTab,
  tooltip,
  style,
  dataTest,
}: Props<T>): JSX.Element {
  const theme = useTheme();
  const expanded = selectedTab != undefined;
  const expandingToolbarButton = useTooltip({
    contents: tooltip,
    // fix me: Tooltip causes jump
  });
  if (!expanded) {
    let selectedTabLocal: T | undefined = selectedTab;
    // default to the first child's name if no tab is selected
    React.Children.forEach(children, (child) => {
      if (selectedTabLocal == undefined) {
        selectedTabLocal = child.props.name as T;
      }
    });

    return (
      <>
        {/* {expandingToolbarButton.tooltip} */}
        <IconButton
          checked={checked}
          elementRef={expandingToolbarButton.ref}
          onClick={() => onSelectTab(selectedTabLocal)}
          iconProps={{ iconName }}
          data-test={`ExpandingToolbar-${tooltip}`}
          styles={{
            root: { backgroundColor: colors.DARK3, pointerEvents: "auto" },
            rootHovered: { backgroundColor: colors.DARK3 },
            rootPressed: { backgroundColor: colors.DARK3 },
            rootDisabled: { backgroundColor: colors.DARK3 },
            rootChecked: { backgroundColor: colors.DARK3 },
            rootCheckedHovered: { backgroundColor: colors.DARK3 },
            rootCheckedPressed: { backgroundColor: colors.DARK3 },
            ...iconStyles,
          }}
        />
      </>
    );
  }
  let selectedChild: ReactElement | undefined;
  React.Children.forEach(children, (child) => {
    if (!selectedChild || child.props.name === selectedTab) {
      selectedChild = child;
    }
  });
  return (
    <Stack
      data-test={dataTest}
      grow={0}
      styles={{
        root: {
          backgroundColor: colors.DARK3,
          borderRadius: theme.effects.roundedCorner2,
          boxShadow: theme.effects.elevation16,
          overflow: "hidden",
          pointerEvents: "auto",
          flexShrink: 0,
        },
      }}
    >
      <Flex row className={classes.tabBar}>
        <Flex row>
          {React.Children.map(children, (child) => {
            return (
              <Button
                className={cx(classes.tab, {
                  [classes.tabSelected]: child === selectedChild,
                })}
                onClick={() => onSelectTab(child.props.name as T)}
              >
                {child.props.name}
              </Button>
            );
          })}
        </Flex>
        <IconButton
          onClick={() => onSelectTab(undefined)}
          iconProps={{ iconName: "ArrowCollapse" }}
          styles={{
            root: { backgroundColor: "transparent" },
            rootHovered: { backgroundColor: "transparent" },
            rootPressed: { backgroundColor: "transparent" },
            rootDisabled: { backgroundColor: "transparent" },
            ...iconStyles,
          }}
        />
      </Flex>
      <div className={classes.tabBody} style={style}>
        {selectedChild}
      </div>
    </Stack>
  );
}
