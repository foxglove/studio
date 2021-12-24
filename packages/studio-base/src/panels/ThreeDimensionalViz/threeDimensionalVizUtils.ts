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

import { quat, vec3, vec4 } from "gl-matrix";
// eslint-disable-next-line no-restricted-imports
import { mergeWith, get } from "lodash";
import { useRef } from "react";

import {
  CameraState,
  Vec3,
  Vec4,
  MouseEventObject,
  cameraStateSelectors,
  DEFAULT_CAMERA_STATE,
} from "@foxglove/regl-worldview";
import { GlobalVariables } from "@foxglove/studio-base/hooks/useGlobalVariables";
import { InteractionData } from "@foxglove/studio-base/panels/ThreeDimensionalViz/Interactions/types";
import { LinkedGlobalVariables } from "@foxglove/studio-base/panels/ThreeDimensionalViz/Interactions/useLinkedGlobalVariables";
import { TransformTree } from "@foxglove/studio-base/panels/ThreeDimensionalViz/transforms";
import { InstancedLineListMarker, MutablePose } from "@foxglove/studio-base/types/Messages";

export type TargetPose = { target: Vec3; targetOrientation: Vec4 };

// Get the camera target position and orientation
function getTargetPose(
  followTf: string | false | undefined,
  transforms: TransformTree,
): TargetPose | undefined {
  if (typeof followTf === "string" && transforms.hasFrame(followTf)) {
    return { target: [0, 0, 0], targetOrientation: [0, 0, 0, 1] };
  }
  return undefined;
}

export function useTransformedCameraState({
  configCameraState,
  followTf,
  followMode,
  transforms,
  poseDelta,
}: {
  configCameraState: Partial<CameraState>;
  followTf?: string;
  followMode: string;
  transforms: TransformTree;
  poseDelta?: MutablePose;
}): { transformedCameraState: CameraState; targetPose?: TargetPose } {
  const transformedCameraState = { ...configCameraState };
  const targetPose = getTargetPose(followTf, transforms);

  // fixme - undefined? skip?
  if (poseDelta) {
    transformedCameraState.target = [
      poseDelta.position.x,
      poseDelta.position.y,
      poseDelta.position.z,
    ];
    transformedCameraState.targetOrientation = [
      poseDelta.orientation.x,
      poseDelta.orientation.y,
      poseDelta.orientation.z,
      poseDelta.orientation.w,
    ];
  } else {
    // TODO: implement difference between follow and follow-orientation
    void followMode;
    transformedCameraState.target = targetPose?.target;
    transformedCameraState.targetOrientation = targetPose?.targetOrientation;
  }

  const mergedCameraState = mergeWith(
    transformedCameraState,
    DEFAULT_CAMERA_STATE,
    (objVal, srcVal) => objVal ?? srcVal,
  );

  return { transformedCameraState: mergedCameraState, targetPose };
}

export const getInstanceObj = (marker: unknown, idx: number): unknown => {
  if (marker == undefined) {
    return;
  }
  return (marker as InstancedLineListMarker).metadataByIndex?.[idx];
};

export const getObject = (selectedObject?: MouseEventObject): unknown => {
  const object =
    (selectedObject?.instanceIndex != undefined &&
      (selectedObject.object as InstancedLineListMarker).metadataByIndex != undefined &&
      getInstanceObj(selectedObject.object, selectedObject.instanceIndex)) ||
    selectedObject?.object;
  return object;
};

export const getInteractionData = (
  selectedObject?: MouseEventObject,
): InteractionData | undefined =>
  (selectedObject?.object as { interactionData?: InteractionData }).interactionData ??
  (getObject(selectedObject) as { interactionData?: InteractionData } | undefined)?.interactionData;

export function getUpdatedGlobalVariablesBySelectedObject(
  selectedObject: MouseEventObject,
  linkedGlobalVariables: LinkedGlobalVariables,
): GlobalVariables | undefined {
  const object = getObject(selectedObject);
  const interactionData = getInteractionData(selectedObject);
  if (
    linkedGlobalVariables.length === 0 ||
    !interactionData ||
    interactionData.topic.length === 0
  ) {
    return;
  }
  const newGlobalVariables: GlobalVariables = {};
  linkedGlobalVariables.forEach(({ topic, markerKeyPath, name }) => {
    if (interactionData.topic === topic) {
      const objectForPath = get(object, [...markerKeyPath].reverse());
      newGlobalVariables[name] = objectForPath;
    }
  });
  return newGlobalVariables;
}

// Return targetOffset and thetaOffset that would yield the same camera position as the
// given offsets if the target were (0,0,0) and targetOrientation were identity.
function getEquivalentOffsetsWithoutTarget(
  offsets: { readonly targetOffset: Vec3; readonly thetaOffset: number },
  targetPose: { readonly target: Vec3; readonly targetOrientation: Vec4 },
  followMode: string,
): { targetOffset: Vec3; thetaOffset: number } {
  const heading =
    followMode === "follow-orientation"
      ? (cameraStateSelectors.targetHeading({
          targetOrientation: targetPose.targetOrientation,
        }) as number)
      : 0;
  const targetOffset = vec3.rotateZ([0, 0, 0], offsets.targetOffset, [0, 0, 0], -heading) as [
    number,
    number,
    number,
  ];
  vec3.add(targetOffset, targetOffset, targetPose.target);
  const thetaOffset = offsets.thetaOffset + heading;
  return { targetOffset, thetaOffset };
}

export function getNewCameraStateOnFollowChange({
  prevCameraState,
  prevTargetPose,
  prevFollowTf,
  prevFollowMode = "follow",
  newFollowTf,
  newFollowMode = "follow",
}: {
  prevCameraState: Partial<CameraState>;
  prevTargetPose?: TargetPose;
  prevFollowTf?: string;
  prevFollowMode?: "follow" | "follow-orientation" | "no-follow";
  newFollowTf?: string;
  newFollowMode?: "follow" | "follow-orientation" | "no-follow";
}): Partial<CameraState> {
  // Neither the followTf or followMode changed, there is nothing to updated with the camera state
  if (newFollowMode === prevFollowMode && prevFollowTf === newFollowTf) {
    return prevCameraState;
  }

  const newCameraState = { ...prevCameraState };

  // if the follow frames changed
  // - reset offset to snap to the frame
  if (newFollowTf !== prevFollowTf) {
    newCameraState.targetOffset = [0, 0, 0];
  }

  if (!prevTargetPose) {
    return newCameraState;
  }

  // When entering a follow mode, reset the camera so it snaps to the frame we are rendering
  if (prevFollowMode === "no-follow" && newFollowMode !== "no-follow") {
    newCameraState.targetOffset = [0, 0, 0];
  }

  /* fixme - I think we no longer need this logic because the camera is always in render frame
  // When switching to follow orientation, adjust thetaOffset to preserve camera rotation.
  if (prevFollowMode !== "follow-orientation" && newFollowMode === "follow-orientation") {
    const heading: number = cameraStateSelectors.targetHeading({
      targetOrientation: prevTargetPose.targetOrientation,
    });
    newCameraState.targetOffset = vec3.rotateZ(
      [0, 0, 0],
      newCameraState.targetOffset ?? DEFAULT_CAMERA_STATE.targetOffset,
      [0, 0, 0],
      heading,
    ) as Vec3;
    newCameraState.thetaOffset =
      (newCameraState.thetaOffset ?? DEFAULT_CAMERA_STATE.thetaOffset) - heading;
  }

  // When unfollowing, preserve the camera position and orientation.
  if (prevFollowMode !== "no-follow" && newFollowMode === "no-follow") {
    Object.assign(
      newCameraState,
      getEquivalentOffsetsWithoutTarget(
        {
          targetOffset: prevCameraState.targetOffset ?? DEFAULT_CAMERA_STATE.targetOffset,
          thetaOffset: prevCameraState.thetaOffset ?? DEFAULT_CAMERA_STATE.thetaOffset,
        },
        prevTargetPose,
        prevFollowMode,
      ),
      { target: [0, 0, 0] },
    );
  }
  */

  return newCameraState;
}
