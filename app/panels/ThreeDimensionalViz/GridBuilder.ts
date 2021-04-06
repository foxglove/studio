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

import { Point, InstancedLineListMarker } from "@foxglove-studio/app/types/Messages";
import { MarkerProvider, MarkerCollector } from "@foxglove-studio/app/types/Scene";

export default class GridBuilder implements MarkerProvider {
  grid: InstancedLineListMarker;

  constructor() {
    this.grid = GridBuilder.BuildGrid();
  }

  renderMarkers = (add: MarkerCollector): void => {
    add.instancedLineList(this.grid);
  };

  static BuildGrid(): InstancedLineListMarker {
    const gridPoints: Point[] = [];
    for (let i = 0; i <= 10; i++) {
      gridPoints.push({ x: i - 5, y: 5, z: 0 });
      gridPoints.push({ x: i - 5, y: -5, z: 0 });

      gridPoints.push({ x: 5, y: i - 5, z: 0 });
      gridPoints.push({ x: -5, y: i - 5, z: 0 });
    }
    const grid: InstancedLineListMarker = {
      type: 108,
      header: { frame_id: "", stamp: { sec: 0, nsec: 0 }, seq: 0 },
      ns: "foxglove",
      id: "grid",
      action: 0,
      pose: { position: { x: 0, y: 0, z: 0 }, orientation: { x: 0, y: 0, z: 0, w: 1 } },
      scale: { x: 1, y: 1, z: 1 },
      color: { r: 36 / 255, g: 142 / 255, b: 255 / 255, a: 1 },
      frame_locked: false,
      points: gridPoints,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (grid as any).scaleInvariant = true;
    return grid;
  }
}
