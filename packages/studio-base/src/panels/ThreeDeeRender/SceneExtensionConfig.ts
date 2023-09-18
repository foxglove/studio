// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { ImageMode } from "@foxglove/studio-base/panels/ThreeDeeRender/renderables/ImageMode/ImageMode";
import { Images } from "@foxglove/studio-base/panels/ThreeDeeRender/renderables/Images";
import { Markers } from "@foxglove/studio-base/panels/ThreeDeeRender/renderables/Markers";
import { PublishSettings } from "@foxglove/studio-base/panels/ThreeDeeRender/renderables/PublishSettings";

import { IRenderer } from "./IRenderer";
import { SceneExtension } from "./SceneExtension";
import { MeasurementTool } from "./renderables/MeasurementTool";
import { PublishClickTool } from "./renderables/PublishClickTool";
import { InterfaceMode } from "./types";
import { SceneSettings } from "@foxglove/studio-base/panels/ThreeDeeRender/renderables/SceneSettings";
import { FrameAxes } from "@foxglove/studio-base/panels/ThreeDeeRender/renderables/FrameAxes";
import { Grids } from "@foxglove/studio-base/panels/ThreeDeeRender/renderables/Grids";
import { FoxgloveSceneEntities } from "@foxglove/studio-base/panels/ThreeDeeRender/renderables/SceneEntities";
import { FoxgloveGrid } from "@foxglove/studio-base/panels/ThreeDeeRender/renderables/FoxgloveGrid";
import { LaserScans } from "@foxglove/studio-base/panels/ThreeDeeRender/renderables/LaserScans";
import { PointClouds } from "@foxglove/studio-base/panels/ThreeDeeRender/renderables/PointClouds";
import { OccupancyGrids } from "@foxglove/studio-base/panels/ThreeDeeRender/renderables/OccupancyGrids";
import { Polygons } from "@foxglove/studio-base/panels/ThreeDeeRender/renderables/Polygons";
import { Poses } from "@foxglove/studio-base/panels/ThreeDeeRender/renderables/Poses";
import { PoseArrays } from "@foxglove/studio-base/panels/ThreeDeeRender/renderables/PoseArrays";
import { VelodyneScans } from "@foxglove/studio-base/panels/ThreeDeeRender/renderables/VelodyneScans";
import { Urdfs } from "@foxglove/studio-base/panels/ThreeDeeRender/renderables/Urdfs";
import { Cameras } from "@foxglove/studio-base/panels/ThreeDeeRender/renderables/Cameras";

export type SceneExtensionConfig = {
  reserved: ReservedSceneExtensionConfig;
  extensionsById: Record<AvailableNames, ExtensionOverride<SceneExtension>>;
};
/** Reserved because the Renderer has members that reference them specifically */

export type ReservedSceneExtensionConfig = {
  imageMode: ExtensionOverride<ImageMode>;
  measurementTool: ExtensionOverride<MeasurementTool>;
  publishClickTool: ExtensionOverride<PublishClickTool>;
  //   cameraHandler: ExtensionOverride<ICameraHandler>;
};

export type ExtensionOverride<ExtensionType extends SceneExtension> = {
  init: (renderer: IRenderer) => ExtensionType;
  /** Which interfaceModes this extension is supported in. If undefined, will default to both '3d' and 'image' modes */
  supportedModes?: InterfaceMode[];
};

type ReservedNames = keyof ReservedSceneExtensionConfig;
type AvailableNames = Exclude<string, ReservedNames>;

export const DEFAULT_SCENE_EXTENSION_CONFIG: SceneExtensionConfig = {
  reserved: {
    imageMode: {
      init: (renderer: IRenderer) => new ImageMode(renderer),
    },
    measurementTool: {
      init: (renderer: IRenderer) => new MeasurementTool(renderer),
    },
    publishClickTool: {
      init: (renderer: IRenderer) => new PublishClickTool(renderer),
    },
  },
  extensionsById: {
    [Images.extensionId]: {
      init: (renderer: IRenderer) => new Images(renderer),
      supportedModes: ["image"],
    },
    [Cameras.extensionId]: {
      init: (renderer: IRenderer) => new Cameras(renderer),
      supportedModes: ["3d"],
    },
    [PublishSettings.extensionId]: {
      init: (renderer: IRenderer) => new PublishSettings(renderer),
      supportedModes: ["3d"],
    },
    [FrameAxes.extensionId]: {
      init: (renderer: IRenderer) =>
        // only show frame axes labels when in 3d mode
        new FrameAxes(renderer, { visible: renderer.interfaceMode === "3d" }),
    },
    [Markers.extensionId]: {
      init: (renderer: IRenderer) => new Markers(renderer),
    },
    [SceneSettings.extensionId]: {
      init: (renderer: IRenderer) => new SceneSettings(renderer),
    },
    [Grids.extensionId]: {
      init: (renderer: IRenderer) => new Grids(renderer),
    },
    [FoxgloveSceneEntities.extensionId]: {
      init: (renderer: IRenderer) => new FoxgloveSceneEntities(renderer),
    },
    [FoxgloveGrid.extensionId]: {
      init: (renderer: IRenderer) => new FoxgloveGrid(renderer),
    },
    [LaserScans.extensionId]: {
      init: (renderer: IRenderer) => new LaserScans(renderer),
    },
    [OccupancyGrids.extensionId]: {
      init: (renderer: IRenderer) => new OccupancyGrids(renderer),
    },
    [PointClouds.extensionId]: {
      init: (renderer: IRenderer) => new PointClouds(renderer),
    },
    [Polygons.extensionId]: {
      init: (renderer: IRenderer) => new Polygons(renderer),
    },
    [Poses.extensionId]: {
      init: (renderer: IRenderer) => new Poses(renderer),
    },
    [PoseArrays.extensionId]: {
      init: (renderer: IRenderer) => new PoseArrays(renderer),
    },
    [Urdfs.extensionId]: {
      init: (renderer: IRenderer) => new Urdfs(renderer),
    },
    [VelodyneScans.extensionId]: {
      init: (renderer: IRenderer) => new VelodyneScans(renderer),
    },
  },
};
