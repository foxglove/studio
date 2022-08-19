// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  SceneEntity,
  SceneEntityDeletion,
  SceneEntityDeletionType,
} from "@foxglove/schemas/schemas/typescript";
import { emptyPose } from "@foxglove/studio-base/util/Pose";

import { BaseUserData, Renderable } from "../Renderable";
import { Renderer } from "../Renderer";
import { Marker, MarkerAction } from "../ros";
import { BaseSettings } from "../settings";
import { updatePose } from "../updatePose";
import type { LayerSettingsMarker } from "./Markers";
import { RenderableMarker, getMarkerId } from "./markers/RenderableMarker";
import { RenderableMeshResource } from "./markers/RenderableMeshResource";
import { PrimitivePool } from "./primitives/PrimitivePool";
import { RenderableCubes } from "./primitives/RenderableCubes";
import { PrimitiveType } from "./primitives/types";
import { missingTransformMessage, MISSING_TRANSFORM } from "./transforms";

export type LayerSettingsMarkerNamespace = BaseSettings;

const INVALID_CUBE_LIST = "INVALID_CUBE_LIST";
const INVALID_LINE_LIST = "INVALID_LINE_LIST";
const INVALID_LINE_STRIP = "INVALID_LINE_STRIP";
const INVALID_DELETION_TYPE = "INVALID_DELETION_TYPE";
const INVALID_MARKER_TYPE = "INVALID_MARKER_TYPE";
const INVALID_POINTS_LIST = "INVALID_POINTS_LIST";
const INVALID_SPHERE_LIST = "INVALID_SPHERE_LIST";

const DEFAULT_NAMESPACE_SETTINGS: LayerSettingsMarkerNamespace = {
  visible: true,
};

export type EntityTopicUserData = BaseUserData & {
  topic: string;
  settings: LayerSettingsMarker;
};

type PartialMarkerSettings = Partial<LayerSettingsMarker> | undefined;

export class MarkersNamespace {
  namespace: string;
  markersById = new Map<number, RenderableMarker>();
  settings: LayerSettingsMarkerNamespace;

  constructor(topic: string, namespace: string, renderer: Renderer) {
    this.namespace = namespace;

    // Set the initial settings from default values merged with any user settings
    const topicSettings = renderer.config.topics[topic] as PartialMarkerSettings;
    const userSettings = topicSettings?.namespaces?.[namespace];
    this.settings = { ...DEFAULT_NAMESPACE_SETTINGS, ...userSettings };
  }
}

type EntityRenderables = {
  [PrimitiveType.CUBES]?: RenderableCubes;
};

export class TopicEntities extends Renderable<EntityTopicUserData> {
  override pickable = false;
  private renderablesById = new Map<string, EntityRenderables>();

  constructor(
    name: string,
    private primitivePool: PrimitivePool,
    renderer: Renderer,
    userData: EntityTopicUserData,
  ) {
    super(name, renderer, userData);
  }

  // eslint-disable-next-line no-restricted-syntax
  get topic(): string {
    return this.userData.topic;
  }

  override dispose(): void {
    this.children.length = 0;
    this._deleteAllEntities();
  }

  deleteEntity(deletion: SceneEntityDeletion): void {
    switch (deletion.type) {
      case 0 as SceneEntityDeletionType.MATCHING_ID:
        this._deleteEntity(deletion.id);
        break;
      case 1 as SceneEntityDeletionType.ALL:
        this._deleteAllEntities();
        break;
      default:
        // Unknown action
        this.renderer.settings.errors.addToTopic(
          this.topic,
          INVALID_DELETION_TYPE,
          `Invalid deletion type ${deletion.type}`,
        );
    }
  }

  startFrame(currentTime: bigint, renderFrameId: string, fixedFrameId: string): void {
    this.visible = this.userData.settings.visible;
    if (!this.visible) {
      this.renderer.settings.errors.clearTopic(this.topic);
      return;
    }

    for (const renderables of this.renderablesById.values()) {
      for (const renderable of Object.values(renderables)) {
        const entity: SceneEntity = renderable.userData.entity; //FIXME: add types
        // const receiveTime = renderable.userData.receiveTime;
        // const expiresIn = renderable.userData.expiresIn;

        // // Check if this entity has expired
        // if (expiresIn != undefined) {
        //   if (currentTime > receiveTime + expiresIn) {
        //     this._deleteEntity(entity.id);
        //     continue;
        //   }
        // }

        const frameId = this.renderer.normalizeFrameId(entity.frame_id);
        const srcTime = entity.frame_locked
          ? currentTime
          : (renderable.userData.messageTime as bigint);
        const updated = updatePose(
          renderable,
          this.renderer.transformTree,
          renderFrameId,
          fixedFrameId,
          frameId,
          currentTime,
          srcTime,
        );
        renderable.visible = updated;
        const topic = this.userData.topic; //FIXME: used to be renderable.userData.topic, does this matter?
        if (!updated) {
          const message = missingTransformMessage(renderFrameId, fixedFrameId, frameId);
          this.renderer.settings.errors.addToTopic(topic, MISSING_TRANSFORM, message);
        } else {
          this.renderer.settings.errors.removeFromTopic(topic, MISSING_TRANSFORM);
        }
      }
    }
  }

  addOrUpdateEntity(entity: SceneEntity, receiveTime: bigint): void {
    let renderable = this.renderablesById.get(entity.id);
    if (!renderable) {
      renderable = {};
      this.renderablesById.set(entity.id, renderable);
    }

    // // Check if the marker with this id changed type
    // if (renderable && renderable.userData.marker.type !== entity.type) {
    //   this._deleteEntity(entity.id);
    //   renderable = undefined;
    // }

    // if (!renderable) {
    //   renderable = this._createMarkerRenderable(entity, receiveTime);
    //   if (!renderable) {
    //     return;
    //   }
    //   this.add(renderable);
    //   this.renderablesById.set(entity.id, renderable);
    // } else {
    //   renderable.update(entity, receiveTime);
    // }

    let cubes = renderable[PrimitiveType.CUBES];
    if (!cubes) {
      cubes = this.primitivePool.acquire(PrimitiveType.CUBES);
      cubes.name = `${entity.id}:${PrimitiveType.CUBES} on ${this.topic}`;
      renderable[PrimitiveType.CUBES] = cubes;
      this.add(cubes);
    }

    cubes.update(entity, receiveTime);
  }

  private _removeRenderables(renderables: EntityRenderables): void {
    for (const [primitiveType, primitive] of Object.entries(renderables) as [
      PrimitiveType,
      EntityRenderables[PrimitiveType],
    ][]) {
      if (primitive) {
        this.remove(primitive);
        this.primitivePool.release(primitiveType, primitive);
      }
    }
  }

  private _deleteEntity(id: string) {
    const renderables = this.renderablesById.get(id);
    if (renderables) {
      this._removeRenderables(renderables);
    }
    this.renderablesById.delete(id);
  }

  private _deleteAllEntities() {
    for (const renderables of this.renderablesById.values()) {
      this._removeRenderables(renderables);
    }
    this.renderablesById.clear();
  }
}
