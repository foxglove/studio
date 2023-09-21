// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as _ from "lodash-es";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { DeepPartial } from "ts-essentials";

import { Immutable, Topic } from "@foxglove/studio";
import { ImageModeConfig } from "@foxglove/studio-base/panels/ThreeDeeRender/IRenderer";
import { DEFAULT_CAMERA_STATE } from "@foxglove/studio-base/panels/ThreeDeeRender/camera";
import { LayerSettingsTransform } from "@foxglove/studio-base/panels/ThreeDeeRender/renderables/FrameAxes";
import { DEFAULT_PUBLISH_SETTINGS } from "@foxglove/studio-base/panels/ThreeDeeRender/renderables/PublishSettings";

import { AnyRendererConfig, RendererConfig, migrateConfigTopicsNodes } from "./config";

/**
 * Fills out missing pieces of a 3d panel config and performs any migrations necessary to
 * the current version.
 *
 * @param initialState initial state obtained from the stored config
 * @param topics topics used to guide migration of unnamespaced topics
 * @returns a migrated config
 */
export function useMigratedThreeDeeConfig(
  initialState: undefined | DeepPartial<AnyRendererConfig>,
  topics: undefined | Immutable<Topic[]>,
): [Immutable<RendererConfig>, Dispatch<SetStateAction<Immutable<RendererConfig>>>] {
  const [initialTopics] = useState(topics);

  const [config, setConfig] = useState<Immutable<RendererConfig>>(() => {
    const partialConfig: DeepPartial<RendererConfig> = initialState ?? {};

    // Initialize the camera from default settings overlaid with persisted settings
    const cameraState = _.merge(_.cloneDeep(DEFAULT_CAMERA_STATE), partialConfig.cameraState ?? {});
    const publish = _.merge(_.cloneDeep(DEFAULT_PUBLISH_SETTINGS), partialConfig.publish ?? {});

    const transforms = (partialConfig.transforms ?? {}) as Record<
      string,
      Partial<LayerSettingsTransform>
    >;

    const completeConfig: RendererConfig = {
      version: "2",
      cameraState,
      followMode: partialConfig.followMode ?? "follow-pose",
      followTf: partialConfig.followTf,
      imageMode: {
        ...(partialConfig.imageMode as RendererConfig["imageMode"]),
        annotations: partialConfig.imageMode?.annotations as
          | ImageModeConfig["annotations"]
          | undefined,
      },
      layers: partialConfig.layers ?? {},
      publish,
      scene: partialConfig.scene ?? {},
      namespacedTopics: partialConfig.namespacedTopics ?? {},
      topics: partialConfig.topics ?? {},
      transforms,
    };

    return migrateConfigTopicsNodes(completeConfig, topics ?? []);
  });

  useEffect(() => {
    if (topics !== initialTopics) {
      setConfig((old) => migrateConfigTopicsNodes(old, topics ?? []));
    }
  }, [initialTopics, topics]);

  return [config, setConfig];
}
