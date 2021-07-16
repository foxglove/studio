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

import { Pivot, PivotItem, Stack, IconButton, makeStyles, useTheme } from "@fluentui/react";
import cx from "classnames";
// import ArrowCollapseIcon from "@mdi/svg/svg/arrow-collapse.svg";
import { ReactElement } from "react";

const PANE_WIDTH = 268;
const PANE_HEIGHT = 240;

const useStyles = makeStyles((theme) => ({
  root: {
    position: "relative",
    cursor: "auto",
    marginRight: `-${theme.spacing.s2}`,
    backgroundColor: theme.semanticColors.buttonBackground,
  },
  content: {
    backgroundColor: theme.semanticColors.bodyBackground,
  },
  toolGroupFixedSizePanel: {
    overflowX: "hidden",
    overflowY: "auto",
    padding: theme.spacing.s1,
    maxWidth: PANE_WIDTH - 28,
    maxHeight: PANE_HEIGHT,
  },
}));

export function ToolGroup<T>({ children }: { name: T; children: React.ReactElement }): JSX.Element {
  return children;
}

export function ToolGroupFixedSizePane({
  children,
}: {
  children: React.ReactElement | React.ReactElement[];
}): JSX.Element {
  const classes = useStyles();
  return <div className={classes.toolGroupFixedSizePanel}>{children}</div>;
}

type Props<T extends string> = {
  children: React.ReactElement<typeof ToolGroup>[] | React.ReactElement<typeof ToolGroup>;
  className?: string;
  icon: React.ReactNode;
  onSelectTab: (name: T | undefined) => void;
  selectedTab?: T; // collapse the toolbar if selectedTab is undefined
  tooltip: string;
  style?: React.CSSProperties;
};

export default function ExpandingToolbar<T extends string>({
  children,
  className,
  icon,
  onSelectTab,
  selectedTab,
  tooltip,
}: Props<T>): JSX.Element {
  const classes = useStyles();
  const theme = useTheme();
  const expanded = selectedTab != undefined;

  if (!expanded) {
    let selectedTabLocal = selectedTab;
    // default to the first child's name if no tab is selected
    React.Children.forEach(children, (child) => {
      if (selectedTabLocal == undefined) {
        selectedTabLocal = child.props.name as T;
      }
    });
    return (
      <IconButton
        onClick={() => onSelectTab(selectedTabLocal)}
        styles={{
          root: {
            margin: 0, // Remove this once global.scss is gone
            marginBottom: theme.spacing.s2,
            marginTop: theme.spacing.s2,
            backgroundColor: theme.semanticColors.buttonBackgroundHovered,
            pointerEvents: "auto",
          },
          rootHovered: {
            backgroundColor: theme.semanticColors.buttonBackgroundPressed,
          },
          icon: {
            height: 20,
          },
        }}
      >
        {icon}
      </IconButton>
    );
  }

  let selectedChild: ReactElement | undefined;

  React.Children.forEach(children, (child) => {
    if (!selectedChild || child.props.name === selectedTab) {
      selectedChild = child;
    }
  });

  return (
    <div className={cx(className, classes.root)}>
      <Stack horizontal>
        <Pivot
          styles={{
            root: {
              paddingLeft: theme.spacing.s2,
              paddingRight: `calc(${theme.spacing.l2} + ${theme.spacing.l2})`,
            },
            link: {
              fontSize: theme.fonts.small.fontSize,
              height: "40px",
            },
          }}
        >
          {React.Children.map(children, (child) => {
            return (
              <PivotItem headerText={child.props.name}>
                <div className={classes.content}>{child}</div>
              </PivotItem>
            );
          })}
        </Pivot>
        <IconButton
          styles={{
            root: {
              position: "absolute",
              top: 0,
              right: 0,
              margin: theme.spacing.s2,
            },
            icon: {
              height: 20,
            },
          }}
          onClick={() => onSelectTab(undefined)}
          iconProps={{ iconName: "Minimize" }}
        />
      </Stack>
    </div>
  );
}
