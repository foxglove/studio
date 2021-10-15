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

import { IconButton, Stack } from "@fluentui/react";
import { useCallback } from "react";
import styled from "styled-components";

import KeyboardShortcut from "@foxglove/studio-base/components/KeyboardShortcut";
import Tooltip, { useTooltip } from "@foxglove/studio-base/components/Tooltip";
import { colors } from "@foxglove/studio-base/util/sharedStyleConstants";

import { Save3DConfig } from "../index";

export const SWITCHER_HEIGHT = 30;

const SErrorsBadge = styled.div`
  position: absolute;
  top: -3px;
  left: 27px;
  width: 10px;
  height: 10px;
  border-radius: 5px;
  background-color: ${colors.RED};
`;

type Props = {
  pinTopics: boolean;
  renderTopicTree: boolean;
  saveConfig: Save3DConfig;
  // eslint-disable-next-line @foxglove/no-boolean-parameters
  setShowTopicTree: (arg0: boolean | ((arg0: boolean) => boolean)) => void;
  showErrorBadge: boolean;
};

export default function TopicTreeSwitcher({
  pinTopics,
  renderTopicTree,
  saveConfig,
  setShowTopicTree,
  showErrorBadge,
}: Props): JSX.Element {
  const onClick = useCallback(() => setShowTopicTree((shown) => !shown), [setShowTopicTree]);

  const pinButton = useTooltip({ placement: "top", contents: "Pin topic picker" });
  const topicButton = useTooltip({ placement: "top", contents: <KeyboardShortcut keys={["T"]} /> });

  return (
    <>
      {renderTopicTree ? pinButton.tooltip : topicButton.tooltip}
      <Stack
        horizontal
        styles={{
          root: {
            position: "relative",
            pointerEvents: "auto",
          },
        }}
      >
        <IconButton
          elementRef={pinButton.ref}
          onClick={() => {
            // Keep TopicTree open after unpin.
            setShowTopicTree(true);
            saveConfig({ pinTopics: !pinTopics });
          }}
          data-test="open-topic-picker"
          iconProps={{ iconName: "Pin" }}
          checked={pinTopics}
          styles={{
            root: {
              transform: `translateY(${renderTopicTree ? 0 : -28}px)`,
              backgroundColor: "transparent",
              opacity: renderTopicTree ? 1 : 0,
              transition: "opacity 0.25s ease-in-out, transform 0.25s ease-in-out",
              pointerEvents: renderTopicTree ? "auto" : "none",
            },
            rootHovered: { backgroundColor: "transparent" },
            rootPressed: { backgroundColor: "transparent" },
            rootDisabled: { backgroundColor: "transparent" },
            rootChecked: { backgroundColor: "transparent" },
            rootCheckedHovered: { backgroundColor: "transparent" },
            rootCheckedPressed: { backgroundColor: "transparent" },
            iconChecked: { color: colors.HIGHLIGHT },
            icon: {
              color: colors.LIGHT1,

              svg: {
                fill: "currentColor",
                height: "1em",
                width: "1em",
              },
            },
          }}
        />
        <IconButton
          elementRef={topicButton.ref}
          onClick={onClick}
          iconProps={{ iconName: "Layers" }}
          styles={{
            root: {
              position: "relative",
              left: -28,
              backgroundColor: colors.DARK3,
              opacity: renderTopicTree ? 0 : 1,
              transition: `opacity 0.15s ease-out ${renderTopicTree ? 0 : 0.2}s`,
              pointerEvents: renderTopicTree ? "none" : "auto",
            },
            rootHovered: { backgroundColor: colors.DARK3 },
            rootPressed: { backgroundColor: colors.DARK3 },
            rootDisabled: { backgroundColor: colors.DARK3 },
            iconChecked: { color: colors.ACCENT },
            icon: {
              color: "white",

              svg: {
                fill: "currentColor",
                height: "1em",
                width: "1em",
              },
            },
          }}
        />
        {showErrorBadge && (
          <Tooltip contents="Errors found in selected topics/namespaces" placement="top">
            <SErrorsBadge />
          </Tooltip>
        )}
      </Stack>
    </>
  );
}
