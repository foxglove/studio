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

import { SvgIcon, Typography } from "@mui/material";

import type { LayoutActions } from "@foxglove/studio";
import ExpandingToolbar, {
  ToolGroup,
  ToolGroupFixedSizePane,
} from "@foxglove/studio-base/components/ExpandingToolbar";

import ObjectDetails from "./ObjectDetails";
import TopicLink from "./TopicLink";
import { InteractionData } from "./types";
import { Pose } from "../transforms";

// ts-prune-ignore-next
export const OBJECT_TAB_TYPE = "Selected object";
export type TabType = typeof OBJECT_TAB_TYPE;

export type SelectionObject = {
  object: {
    pose: Pose;
    interactionData?: InteractionData;
  };
  instanceIndex: number | undefined;
};

type Props = {
  interactionsTabType?: TabType;
  setInteractionsTabType: (arg0?: TabType) => void;
  addPanel: LayoutActions["addPanel"];
  selectedObject?: SelectionObject;
};

const InteractionsBaseComponent = React.memo<Props>(function InteractionsBaseComponent({
  addPanel,
  selectedObject,
  interactionsTabType,
  setInteractionsTabType,
}: Props) {
  const selectedInteractionData = selectedObject?.object.interactionData;
  const originalMessage = selectedInteractionData?.originalMessage;
  const instanceDetails = selectedInteractionData?.instanceDetails;

  return (
    <ExpandingToolbar
      tooltip="Inspect objects"
      icon={
        <SvgIcon>
          <path d="M13.64,21.97C13.14,22.21 12.54,22 12.31,21.5L10.13,16.76L7.62,18.78C7.45,18.92 7.24,19 7,19A1,1 0 0,1 6,18V3A1,1 0 0,1 7,2C7.24,2 7.47,2.09 7.64,2.23L7.65,2.22L19.14,11.86C19.57,12.22 19.62,12.85 19.27,13.27C19.12,13.45 18.91,13.57 18.7,13.61L15.54,14.23L17.74,18.96C18,19.46 17.76,20.05 17.26,20.28L13.64,21.97Z" />
        </SvgIcon>
      }
      selectedTab={interactionsTabType}
      onSelectTab={(newSelectedTab) => setInteractionsTabType(newSelectedTab)}
    >
      <ToolGroup name={OBJECT_TAB_TYPE}>
        <ToolGroupFixedSizePane>
          {originalMessage ? (
            <>
              {selectedInteractionData.topic && (
                <TopicLink addPanel={addPanel} topic={selectedInteractionData.topic} />
              )}
              {instanceDetails ? <ObjectDetails selectedObject={instanceDetails} /> : <></>}
              <ObjectDetails
                selectedObject={originalMessage}
                interactionData={selectedInteractionData}
              />
            </>
          ) : (
            <Typography variant="body2" color="text.disabled" gutterBottom>
              Click an object in the 3D view to select it.
            </Typography>
          )}
        </ToolGroupFixedSizePane>
      </ToolGroup>
    </ExpandingToolbar>
  );
});

// Wrap the Interactions so that we don't rerender every time any part of the PanelContext config changes, but just the
// one value that we care about.
export default function Interactions(props: Props): JSX.Element {
  return <InteractionsBaseComponent {...props} />;
}
