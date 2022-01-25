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

import { Stack, useTheme } from "@fluentui/react";

import { MouseEventObject } from "@foxglove/regl-worldview";
import { Time } from "@foxglove/rostime";
import CameraInfo from "@foxglove/studio-base/panels/ThreeDimensionalViz/CameraInfo";
import Crosshair from "@foxglove/studio-base/panels/ThreeDimensionalViz/Crosshair";
import FollowTFControl from "@foxglove/studio-base/panels/ThreeDimensionalViz/FollowTFControl";
import { InteractionStateProps } from "@foxglove/studio-base/panels/ThreeDimensionalViz/InteractionState";
import Interactions from "@foxglove/studio-base/panels/ThreeDimensionalViz/Interactions";
import { TabType } from "@foxglove/studio-base/panels/ThreeDimensionalViz/Interactions/Interactions";
import { LayoutToolbarSharedProps } from "@foxglove/studio-base/panels/ThreeDimensionalViz/Layout";
import MainToolbar from "@foxglove/studio-base/panels/ThreeDimensionalViz/MainToolbar";
import MeasureMarker from "@foxglove/studio-base/panels/ThreeDimensionalViz/MeasureMarker";
import { MeasuringTool } from "@foxglove/studio-base/panels/ThreeDimensionalViz/MeasuringTool";
import { PublishMarker } from "@foxglove/studio-base/panels/ThreeDimensionalViz/PublishMarker";
import { PublishPoseTool } from "@foxglove/studio-base/panels/ThreeDimensionalViz/PublishPoseTool";
import SearchText, {
  SearchTextProps,
} from "@foxglove/studio-base/panels/ThreeDimensionalViz/SearchText";
import {
  MouseEventHandlerProps,
  ThreeDimensionalVizConfig,
} from "@foxglove/studio-base/panels/ThreeDimensionalViz/types";

type Props = InteractionStateProps &
  LayoutToolbarSharedProps &
  MouseEventHandlerProps &
  SearchTextProps & {
    autoSyncCameraState: boolean;
    config: ThreeDimensionalVizConfig;
    currentTime: Time;
    debug: boolean;
    fixedFrameId?: string;
    interactionsTabType?: TabType;
    onToggleCameraMode: () => void;
    onToggleDebug: () => void;
    renderFrameId?: string;
    selectedObject?: MouseEventObject;
    setInteractionsTabType: (arg0?: TabType) => void;
    showCrosshair?: boolean;
  };

function LayoutToolbar({
  addMouseEventHandler,
  autoSyncCameraState,
  cameraState,
  config,
  currentTime,
  debug,
  fixedFrameId,
  followMode,
  followTf,
  interactionsTabType,
  interactionState,
  interactionStateDispatch,
  isPlaying,
  onAlignXYAxis,
  onCameraStateChange,
  onFollowChange,
  onToggleCameraMode,
  onToggleDebug,
  removeMouseEventHandler,
  renderFrameId,
  searchInputRef,
  searchText,
  searchTextMatches,
  searchTextOpen,
  selectedMatchIndex,
  selectedObject,
  setInteractionsTabType,
  setSearchText,
  setSearchTextMatches,
  setSelectedMatchIndex,
  showCrosshair = false,
  toggleSearchTextOpen,
  transforms,
}: Props) {
  const theme = useTheme();
  return (
    <>
      <Stack
        styles={{
          root: {
            position: "absolute",
            top: `calc(${theme.spacing.l2} + ${theme.spacing.s1})`,
            right: theme.spacing.m,
            zIndex: 101,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            // allow mouse events to pass through the empty space in this container element
            pointerEvents: "none",
          },
        }}
        tokens={{ childrenGap: theme.spacing.s1 }}
      >
        <FollowTFControl
          transforms={transforms}
          followTf={followTf}
          followMode={followMode}
          onFollowChange={onFollowChange}
        />
        <SearchText
          searchTextOpen={searchTextOpen}
          toggleSearchTextOpen={toggleSearchTextOpen}
          searchText={searchText}
          setSearchText={setSearchText}
          setSearchTextMatches={setSearchTextMatches}
          searchTextMatches={searchTextMatches}
          searchInputRef={searchInputRef}
          setSelectedMatchIndex={setSelectedMatchIndex}
          selectedMatchIndex={selectedMatchIndex}
          onCameraStateChange={onCameraStateChange}
          cameraState={cameraState}
          transforms={transforms}
          renderFrameId={renderFrameId}
          fixedFrameId={fixedFrameId}
          currentTime={currentTime}
        />
        <Stack
          horizontal
          verticalAlign="center"
          styles={{ root: { position: "relative" } }}
          tokens={{ childrenGap: theme.spacing.s1 }}
        >
          <MainToolbar
            debug={debug}
            interactionState={interactionState}
            interactionStateDispatch={interactionStateDispatch}
            onToggleCameraMode={onToggleCameraMode}
            onToggleDebug={onToggleDebug}
            perspective={cameraState.perspective}
          />
        </Stack>
        <Interactions
          selectedObject={selectedObject}
          interactionsTabType={interactionsTabType}
          setInteractionsTabType={setInteractionsTabType}
        />
        <CameraInfo
          cameraState={cameraState}
          followMode={followMode}
          followTf={followTf}
          isPlaying={isPlaying}
          onAlignXYAxis={onAlignXYAxis}
          onCameraStateChange={onCameraStateChange}
          showCrosshair={showCrosshair}
          autoSyncCameraState={autoSyncCameraState}
        />
      </Stack>
      {!cameraState.perspective && showCrosshair && <Crosshair cameraState={cameraState} />}
      {interactionState.tool.name === "measure" && (
        <MeasuringTool
          addMouseEventHandler={addMouseEventHandler}
          interactionState={interactionState}
          interactionStateDispatch={interactionStateDispatch}
          removeMouseEventHandler={removeMouseEventHandler}
        />
      )}
      {interactionState.tool.name === "publish-click" && fixedFrameId && (
        <PublishPoseTool
          addMouseEventHandler={addMouseEventHandler}
          config={config}
          frameId={fixedFrameId}
          interactionState={interactionState}
          interactionStateDispatch={interactionStateDispatch}
          removeMouseEventHandler={removeMouseEventHandler}
        />
      )}
      {interactionState.measure && <MeasureMarker points={interactionState.measure} />}
      {interactionState.publish && <PublishMarker points={interactionState.publish} />}
    </>
  );
}

export default React.memo<Props>(LayoutToolbar);
