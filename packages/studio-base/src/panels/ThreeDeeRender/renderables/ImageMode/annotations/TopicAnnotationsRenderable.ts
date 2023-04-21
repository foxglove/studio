// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as THREE from "three";

import { PinholeCameraModel } from "@foxglove/den/image";
import { Annotation as NormalizedAnnotation } from "@foxglove/studio-base/panels/Image/types";

import { LineListRenderable } from "./LineListRenderable";
import { PointsRenderable } from "./PointsRenderable";

export class TopicAnnotationsRenderable extends THREE.Object3D {
  #points?: PointsRenderable;
  #lineList?: LineListRenderable;
  #scale = 0; // TODO: get correct initial scale

  public dispose(): void {
    this.#points?.dispose();
  }

  public updateScale(scale: number): void {
    this.#scale = scale;
    //TODO: re-render immediately with new scale
  }

  public update(annotations: NormalizedAnnotation[], cameraModel: PinholeCameraModel): void {
    if (this.#points) {
      this.#points.visible = false;
    }
    if (this.#lineList) {
      this.#lineList.visible = false;
    }
    for (const annotation of annotations) {
      switch (annotation.type) {
        case "circle":
          break;
        case "points":
          switch (annotation.style) {
            case "points":
              if (!this.#points) {
                this.#points = new PointsRenderable();
                this.add(this.#points);
              }
              this.#points.visible = true;
              this.#points.update(
                annotation as typeof annotation & { style: typeof annotation.style },
                cameraModel,
                this.#scale,
              );
              break;
            case "polygon":
              break;
            case "line_strip":
              break;
            case "line_list":
              if (!this.#lineList) {
                this.#lineList = new LineListRenderable();
                this.add(this.#lineList);
              }
              this.#lineList.visible = true;
              this.#lineList.update(
                annotation as typeof annotation & { style: typeof annotation.style },
                cameraModel,
                this.#scale,
              );
              break;
          }
          break;
        case "text":
          break;
      }
    }
  }
}
