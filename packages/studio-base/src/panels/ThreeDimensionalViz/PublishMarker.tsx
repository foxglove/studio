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

import { Point, Arrows } from "@foxglove/regl-worldview";
import { PublishClickType } from "@foxglove/studio-base/panels/ThreeDimensionalViz/InteractionState";

type Props = {
  points: {
    start?: Point;
    end?: Point;
    type: PublishClickType;
  };
};

const colors: Record<PublishClickType, { r: number; g: number; b: number; a: number }> = {
  pose: { r: 0, g: 1, b: 1, a: 1 },
  goal: { r: 1, g: 0, b: 1, a: 1 },
  point: { r: 1, g: 1, b: 0, a: 1 },
} as const;

export function PublishMarker({ points: { start, end, type } }: Props): JSX.Element {
  const arrows = [];

  if (start) {
    const arrow = {
      action: 0,
      id: "_publish_click",
      pose: {
        orientation: { x: 0, y: 0, z: 0, w: 1 },
        position: { x: 0, y: 0, z: 0 },
      },
      points: [start, end ?? start],
      scale: { x: 0.25, y: 0.5, z: 0.5 },
      color: colors[type],
      type: 0,
    };
    arrows.push(arrow);
  }

  return <Arrows>{arrows}</Arrows>;
}
