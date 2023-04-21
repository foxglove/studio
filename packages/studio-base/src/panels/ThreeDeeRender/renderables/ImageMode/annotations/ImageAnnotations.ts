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
import { ImageModeConfig } from "@foxglove/studio-base/panels/ThreeDeeRender/IRenderer";

import { TopicAnnotationsRenderable } from "./TopicAnnotationsRenderable";
import { SettingsTreeEntry } from "../../../SettingsManager";
import { IMAGE_ANNOTATIONS_DATATYPES } from "../../../foxglove";
import { IMAGE_MARKER_ARRAY_DATATYPES, IMAGE_MARKER_DATATYPES } from "../../../ros";
import { topicIsConvertibleToSchema } from "../../../topicIsConvertibleToSchema";

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

/**
 * This class handles settings and rendering for ImageAnnotations/ImageMarkers.
 */
export class ImageAnnotations extends THREE.Object3D {
  #context: ImageAnnotationsContext;

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
    //TODO: get initial scale in constructor?
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
