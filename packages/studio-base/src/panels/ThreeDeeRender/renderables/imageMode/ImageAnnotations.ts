// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { t } from "i18next";
import { set } from "lodash";
import * as THREE from "three";

import { SettingsTreeAction, Topic } from "@foxglove/studio";
import { ImageModeConfig } from "@foxglove/studio-base/panels/ThreeDeeRender/IRenderer";

import { SettingsTreeEntry } from "../../SettingsManager";
import { IMAGE_ANNOTATIONS_DATATYPES } from "../../foxglove";
import { IMAGE_MARKER_ARRAY_DATATYPES, IMAGE_MARKER_DATATYPES } from "../../ros";
import { topicIsConvertibleToSchema } from "../../topicIsConvertibleToSchema";

interface ImageAnnotationsContext {
  topics(): readonly Topic[];
  config(): ImageModeConfig;
  updateConfig(updateHandler: (draft: ImageModeConfig) => void): void;
  updateSettingsTree(): void;
  // addSchemaSubscriptions
}

/**
 * This class handles settings and rendering for ImageAnnotations/ImageMarkers.
 */
export class ImageAnnotations extends THREE.Object3D {
  #context: ImageAnnotationsContext;

  public constructor(context: ImageAnnotationsContext) {
    super();
    this.#context = context;
  }

  #handleTopicVisibilityChange(topic: Topic, action: SettingsTreeAction): void {
    if (action.action !== "update" || action.payload.path.length < 2) {
      return;
    }
    if (action.payload.path[0] !== "imageAnnotations" || action.payload.path[2] !== "visible") {
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
