// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
//
// This file incorporates work covered by the following copyright and
// permission notice:
//
//   Copyright 2019-2021 Cruise LLC
//
//   This source code is licensed under the Apache License, Version 2.0,
//   found at http://www.apache.org/licenses/LICENSE-2.0
//   You may not use this file except in compliance with the License.

import { Link, Stack, Text, makeStyles, useTheme } from "@fluentui/react";
import cx from "classnames";
import { useCallback } from "react";
import { useDrop } from "react-dnd";
import { MosaicDragType } from "react-mosaic-component";

import ChildToggle from "@foxglove/studio-base/components/ChildToggle";
import Menu from "@foxglove/studio-base/components/Menu";
import PanelList, { PanelSelection } from "@foxglove/studio-base/components/PanelList";
import { useCurrentLayoutActions } from "@foxglove/studio-base/context/CurrentLayoutContext";
import { MosaicDropResult } from "@foxglove/studio-base/types/panels";
import { getPanelIdForType } from "@foxglove/studio-base/util/layout";

const useStyles = makeStyles((theme) => ({
  dropzone: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
    width: "100%",
    height: "100%",
    border: "1px solid transparent",
  },
  dropzoneOver: {
    backgroundColor: theme.palette.neutralLighterAlt,
    borderColor: theme.palette.neutralLight,
  },
}));

type Props = {
  tabId?: string;
};

export const EmptyDropTarget = ({ tabId }: Props): JSX.Element => {
  const theme = useTheme();
  const classes = useStyles();
  const { addPanel } = useCurrentLayoutActions();

  const [{ isOver }, drop] = useDrop<unknown, MosaicDropResult, { isOver: boolean }>({
    accept: MosaicDragType.WINDOW,
    drop: () => {
      return { tabId };
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const onPanelSelect = useCallback(
    ({ type, config, relatedConfigs }: PanelSelection) => {
      const id = getPanelIdForType(type);
      addPanel({ tabId, id, config, relatedConfigs });
    },
    [addPanel, tabId],
  );

  return (
    <div
      ref={drop}
      data-test="empty-drop-target"
      className={cx(classes.dropzone, {
        [classes.dropzoneOver]: isOver,
      })}
    >
      <Stack
        horizontalAlign="center"
        verticalFill
        verticalAlign="center"
        tokens={{ childrenGap: theme.spacing.l1, padding: theme.spacing.m }}
      >
        <svg
          width="150"
          height="64"
          viewBox="0 0 150 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <ellipse cx="75" cy="53.5" rx="75" ry="10.5" fill={theme.palette.neutralLighter} />
          <path
            d="M16 19H132V47C132 50.3137 129.314 53 126 53H22C18.6863 53 16 50.3137 16 47V19Z"
            fill={theme.palette.neutralLighterAlt}
            strokeWidth="2"
          />
          <path
            d="M17 18.8202H132M17 18.8202V46.8202C17 50.1339 19.6863 52.8202 23 52.8202H126C129.314 52.8202 132 50.1339 132 46.8202V18.8202M17 18.8202L28.3161 1H119L132 18.8202"
            stroke={theme.palette.neutralLight}
            strokeWidth="2"
            strokeLinecap="square"
          />
          <path
            d="M57 29.5C57 27.567 58.567 26 60.5 26H87.5C89.433 26 91 27.567 91 29.5C91 31.433 89.433 33 87.5 33H60.5C58.567 33 57 31.433 57 29.5Z"
            fill={theme.palette.white}
            stroke={theme.palette.neutralLight}
            strokeWidth="2"
          />
          <rect
            x="62"
            y="6"
            width="25"
            height="5"
            rx="2.5"
            fill={theme.palette.white}
            stroke={theme.palette.neutralLight}
            strokeWidth="2"
          />
          <line
            x1="29"
            y1="1"
            x2="29"
            y2="19"
            stroke={theme.palette.neutralLight}
            strokeWidth="2"
          />
          <line
            x1="119"
            y1="1"
            x2="119"
            y2="19"
            stroke={theme.palette.neutralLight}
            strokeWidth="2"
          />
        </svg>

        <Text
          variant="mediumPlus"
          styles={{
            root: {
              color: theme.semanticColors.disabledText,
              textAlign: "center",
              lineHeight: "1.5",
            },
          }}
        >
          Nothing here yet.
          <br />
          <ChildToggle position="below" style={{ display: "inline-flex" }}>
            <Link data-test="pick-a-panel">Pick a panel</Link>
            <Menu>
              <PanelList onPanelSelect={onPanelSelect} />
            </Menu>
          </ChildToggle>{" "}
          or drag one in to get started.
        </Text>
      </Stack>
    </div>
  );
};
