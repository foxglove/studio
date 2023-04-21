// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { t } from "i18next";
import { set } from "lodash";
import * as THREE from "three";

import { PinholeCameraModel } from "@foxglove/den/image";
import { ImageAnnotations as FoxgloveImageAnnotations } from "@foxglove/schemas";
import { MessageEvent, SettingsTreeAction, Topic } from "@foxglove/studio";
import { normalizeAnnotations } from "@foxglove/studio-base/panels/Image/lib/normalizeAnnotations";
import {
  Annotation as NormalizedAnnotation,
  PointsAnnotation as NormalizedPointsAnnotation,
} from "@foxglove/studio-base/panels/Image/types";
import { ImageModeConfig } from "@foxglove/studio-base/panels/ThreeDeeRender/IRenderer";
import { SRGBToLinear } from "@foxglove/studio-base/panels/ThreeDeeRender/color";

import { DynamicBufferGeometry } from "../../../DynamicBufferGeometry";
import { SettingsTreeEntry } from "../../../SettingsManager";
import { IMAGE_ANNOTATIONS_DATATYPES } from "../../../foxglove";
import { IMAGE_MARKER_ARRAY_DATATYPES, IMAGE_MARKER_DATATYPES } from "../../../ros";
import { topicIsConvertibleToSchema } from "../../../topicIsConvertibleToSchema";

const tempVec3 = new THREE.Vector3();

interface ImageAnnotationsContext {
  topics(): readonly Topic[];
  config(): ImageModeConfig;
  updateConfig(updateHandler: (draft: ImageModeConfig) => void): void;
  updateSettingsTree(): void;
  addSchemaSubscriptions<T>(
    schemaNames: Set<string>,
    handler: (messageEvent: MessageEvent<T>) => void,
  ): void;
}

class PointsRenderable extends THREE.Object3D {
  #geometry: DynamicBufferGeometry;
  #points: THREE.Points;
  #pointsMaterial: THREE.PointsMaterial;

  public constructor() {
    super();
    this.#geometry = new DynamicBufferGeometry();
    this.#geometry.createAttribute("position", Float32Array, 3);
    this.#geometry.createAttribute("color", Uint8Array, 4, true);
    this.#pointsMaterial = new THREE.PointsMaterial({
      size: 1,
      sizeAttenuation: false, // Point size is based on viewport size and image size, not 3D position
      vertexColors: true,
    });
    this.#points = new THREE.Points(this.#geometry, this.#pointsMaterial);
    this.add(this.#points);
  }

  public dispose() {
    this.#geometry.dispose();
    this.#pointsMaterial.dispose();
  }

  public update(
    annotation: NormalizedPointsAnnotation & { style: "points" },
    cameraModel: PinholeCameraModel,
    scale: number,
  ): void {
    const { points, outlineColors, outlineColor, fillColor, thickness } = annotation;
    this.#geometry.resize(points.length);
    const positionAttribute = this.#geometry.getAttribute("position") as THREE.BufferAttribute;
    const colorAttribute = this.#geometry.getAttribute("color") as THREE.BufferAttribute;
    const positions = positionAttribute.array as Float32Array;
    const colors = colorAttribute.array as Uint8Array;
    const fallbackColor = outlineColor && outlineColor.a > 0 ? outlineColor : fillColor;

    this.#pointsMaterial.size = thickness * scale;
    for (let i = 0; i < points.length; i++) {
      const color = outlineColors[i] ?? fallbackColor;
      const point = points[i]!;
      if (cameraModel.projectPixelTo3dPlane(tempVec3, point)) {
        positions[i * 3 + 0] = tempVec3.x;
        positions[i * 3 + 1] = tempVec3.y;
        positions[i * 3 + 2] = tempVec3.z;
        colors[i * 4 + 0] = SRGBToLinear(color?.r ?? 0) * 255;
        colors[i * 4 + 1] = SRGBToLinear(color?.g ?? 0) * 255;
        colors[i * 4 + 2] = SRGBToLinear(color?.b ?? 0) * 255;
        colors[i * 4 + 3] = (color?.a ?? 0) * 255;
      } else {
        positions[i * 3 + 0] = NaN;
        positions[i * 3 + 1] = NaN;
        positions[i * 3 + 2] = NaN;
      }
    }
    positionAttribute.needsUpdate = true;
    colorAttribute.needsUpdate = true;
  }
}

class TopicAnnotationsRenderable extends THREE.Object3D {
  #points?: PointsRenderable;
  #scale = 1;

  public dispose(): void {
    this.#points?.dispose();
  }

  public updateScale(scale: number): void {
    this.#scale = scale;
    //TODO: re-render immediately with new scale
  }

  public update(annotations: NormalizedAnnotation[], cameraModel: PinholeCameraModel) {
    if (this.#points) {
      this.#points.visible = false;
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
              break;
          }
          break;
        case "text":
          break;
      }
    }
  }
}

/**
 * This class handles settings and rendering for ImageAnnotations/ImageMarkers.
 */
export class ImageAnnotations extends THREE.Object3D {
  #context: ImageAnnotationsContext;

  #annotationsByTopic = new Map<string, FoxgloveImageAnnotations>();
  #renderablesByTopic = new Map<string, TopicAnnotationsRenderable>();
  #cameraModel?: PinholeCameraModel;

  public constructor(context: ImageAnnotationsContext) {
    super();
    this.#context = context;

    this.#context.addSchemaSubscriptions(
      IMAGE_ANNOTATIONS_DATATYPES,
      this.#handleImageAnnotations.bind(this),
    );
    this.#context.addSchemaSubscriptions(
      IMAGE_MARKER_DATATYPES,
      this.#handleImageMarker.bind(this),
    );
    this.#context.addSchemaSubscriptions(
      IMAGE_MARKER_ARRAY_DATATYPES,
      this.#handleImageMarkerArray.bind(this),
    );
  }
  /**
   * Called when the scene is being destroyed. Free any unmanaged resources such as GPU buffers
   * here. The base class implementation calls dispose() on all `renderables`.
   */
  public dispose(): void {
    for (const renderable of this.#renderablesByTopic.values()) {
      renderable.dispose();
    }
    this.children.length = 0;
    this.#renderablesByTopic.clear();
  }

  /**
   * Called when seeking or a new data source is loaded. The base class implementation removes all
   * `renderables` and calls `updateSettingsTree()`.
   */
  public removeAllRenderables(): void {
    for (const renderable of this.#renderablesByTopic.values()) {
      renderable.dispose();
      this.remove(renderable);
    }
    this.#renderablesByTopic.clear();
    // this.#context.updateSettingsTree();
  }

  public updateScale(scale: number): void {
    for (const renderable of this.#renderablesByTopic.values()) {
      renderable.updateScale(scale);
    }
  }

  public updateCameraModel(cameraModel: PinholeCameraModel): void {
    this.#cameraModel = cameraModel;
    // for (const renderable of this.#renderablesByTopic.values()) {
    //   renderable.update(cameraModel);
    // }
  }

  #handleImageAnnotations(messageEvent: MessageEvent<FoxgloveImageAnnotations>) {
    const annotations = normalizeAnnotations(messageEvent.message, messageEvent.schemaName);
    if (!annotations) {
      return;
    }

    let renderable = this.#renderablesByTopic.get(messageEvent.topic);
    if (!renderable) {
      renderable = new TopicAnnotationsRenderable();
      this.#renderablesByTopic.set(messageEvent.topic, renderable);
      this.add(renderable);
    }

    if (!this.#cameraModel) {
      //TODO: store annotations so we can render them when there is a cameraModel
      return;
    }
    renderable.update(annotations, this.#cameraModel);
  }

  #handleImageMarker(_messageEvent: MessageEvent<unknown>) {
    //TODO
  }
  #handleImageMarkerArray(_messageEvent: MessageEvent<unknown>) {
    //TODO
  }

  #handleTopicVisibilityChange(topic: Topic, action: SettingsTreeAction): void {
    if (action.action !== "update" || action.payload.path.length < 2) {
      return;
    }
    if (
      action.payload.path[0] !== "imageAnnotations" ||
      action.payload.path[2] !== "visible" ||
      typeof action.payload.value !== "boolean"
    ) {
      return;
    }
    this.#context.updateConfig((draft) => {
      draft.annotationsByTopicAndSchema ??= {};
      set(
        draft.annotationsByTopicAndSchema,
        [topic.name, topic.schemaName, "visible"],
        action.payload.value,
      );
    });
    const renderable = this.#renderablesByTopic.get(topic.name);
    if (renderable) {
      renderable.visible = action.payload.value;
    }
    this.#context.updateSettingsTree();
  }

  public settingsNodes(): SettingsTreeEntry[] {
    const entries: SettingsTreeEntry[] = [];

    entries.push({
      path: ["imageAnnotations"],
      node: {
        label: t("threeDee:imageAnnotations"),
        enableVisibilityFilter: true,
        defaultExpansionState: "expanded",
      },
    });
    const config = this.#context.config();
    let i = 0;
    for (const topic of this.#context.topics()) {
      if (
        !(
          topicIsConvertibleToSchema(topic, IMAGE_ANNOTATIONS_DATATYPES) ||
          topicIsConvertibleToSchema(topic, IMAGE_MARKER_DATATYPES) ||
          topicIsConvertibleToSchema(topic, IMAGE_MARKER_ARRAY_DATATYPES)
        )
      ) {
        continue;
      }
      entries.push({
        // We want 2 levels of nesting in the panel config
        // (annotationsByTopicAndSchema[topic][schema]), but only 1 level of nesting in the settings
        // tree (all annotation topics listed under "Image annotations"). So when building the tree,
        // we just use a numeric index in the path. Inside the handler, this part of the path is
        // ignored, and instead we pass in the `topic` directly so the handler knows which value to
        // update in the config.
        path: ["imageAnnotations", `${i++}`],
        node: {
          label: topic.name,
          visible:
            config.annotationsByTopicAndSchema?.[topic.name]?.[topic.schemaName]?.visible ?? false,
          handler: this.#handleTopicVisibilityChange.bind(this, topic),
        },
      });
    }
    return entries;
  }
}
