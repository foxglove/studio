// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { set } from "lodash";

import { toNanoSec } from "@foxglove/rostime";
import type {
  ArrowPrimitive,
  CubePrimitive,
  CylinderPrimitive,
  LinePrimitive,
  LineType,
  ModelPrimitive,
  SceneEntity,
  SceneUpdate,
  SpherePrimitive,
  TextPrimitive,
  TriangleListPrimitive,
} from "@foxglove/schemas/schemas/typescript";
import { SettingsTreeAction } from "@foxglove/studio";

import { Renderer } from "../Renderer";
import { PartialMessage, PartialMessageEvent, SceneExtension } from "../SceneExtension";
import { SettingsTreeEntry, SettingsTreeNodeWithActionHandler } from "../SettingsManager";
import { SCENE_UPDATE_DATATYPES } from "../foxglove";
import {
  normalizeColorRGBA,
  normalizeColorRGBAs,
  normalizeHeader,
  normalizePose,
  normalizeTime,
  normalizeVector3,
  normalizeVector3s,
  normalizeByteArray,
} from "../normalizeMessages";
// import { Marker, MarkerArray, MARKER_ARRAY_DATATYPES, MARKER_DATATYPES } from "../ros";
import { BaseSettings } from "../settings";
import { makePose } from "../transforms";
import { LayerSettingsMarkerNamespace, TopicEntities } from "./TopicEntities";

export type LayerSettingsEntity = BaseSettings & {
  // namespaces: Record<string, LayerSettingsMarkerNamespace>;
};

const DEFAULT_SETTINGS: LayerSettingsEntity = {
  visible: false,
  // namespaces: {},
};

export class FoxgloveSceneEntities extends SceneExtension<TopicEntities> {
  constructor(renderer: Renderer) {
    super("foxglove.SceneEntities", renderer);

    renderer.addDatatypeSubscriptions(SCENE_UPDATE_DATATYPES, this.handleSceneUpdate);
  }

  override settingsNodes(): SettingsTreeEntry[] {
    const configTopics = this.renderer.config.topics;
    const entries: SettingsTreeEntry[] = [];
    for (const topic of this.renderer.topics ?? []) {
      if (SCENE_UPDATE_DATATYPES.has(topic.datatype)) {
        const config = (configTopics[topic.name] ?? {}) as Partial<LayerSettingsEntity>;

        const node: SettingsTreeNodeWithActionHandler = {
          label: topic.name,
          icon: "Shapes",
          order: topic.name.toLocaleLowerCase(),
          visible: config.visible ?? DEFAULT_SETTINGS.visible,
          handler: this.handleSettingsAction,
        };

        // // Create a list of all the namespaces for this topic
        // const topicEntities = this.renderables.get(topic.name);
        // const namespaces = Array.from(topicEntities?.namespaces.values() ?? [])
        //   .filter((ns) => ns.namespace !== "")
        //   .sort((a, b) => a.namespace.localeCompare(b.namespace));
        // if (namespaces.length > 0) {
        //   node.children = {};
        //   for (const ns of namespaces) {
        //     const child: SettingsTreeNodeWithActionHandler = {
        //       label: ns.namespace,
        //       icon: "Shapes",
        //       visible: ns.settings.visible,
        //       defaultExpansionState: namespaces.length > 1 ? "collapsed" : "expanded",
        //       handler: this.handleSettingsActionNamespace,
        //     };
        //     node.children[`ns:${ns.namespace}`] = child;
        //   }
        // }

        entries.push({ path: ["topics", topic.name], node });
      }
    }
    return entries;
  }

  override startFrame(currentTime: bigint, renderFrameId: string, fixedFrameId: string): void {
    // Don't use SceneExtension#startFrame() because our renderables represent one topic each with
    // many entities. Instead, call startFrame on each renderable
    for (const renderable of this.renderables.values()) {
      renderable.startFrame(currentTime, renderFrameId, fixedFrameId);
    }
  }

  override handleSettingsAction = (action: SettingsTreeAction): void => {
    const path = action.payload.path;
    if (action.action !== "update" || path.length !== 3) {
      return;
    }

    this.saveSetting(path, action.payload.value);

    // Update the TopicEntities settings
    const topicName = path[1]!;
    const renderable = this.renderables.get(topicName);
    if (renderable) {
      const settings = this.renderer.config.topics[topicName] as
        | Partial<LayerSettingsEntity>
        | undefined;
      renderable.userData.settings = { ...renderable.userData.settings, ...settings };
    }
  };

  // handleSettingsActionNamespace = (action: SettingsTreeAction): void => {
  //   const path = action.payload.path;
  //   if (action.action !== "update" || path.length !== 4) {
  //     return;
  //   }

  //   const topicName = path[1]!;
  //   const namespaceKey = path[2]!;
  //   const fieldName = path[3]!;
  //   const namespace = namespaceKey.slice(3); // remove `ns:` prefix

  //   this.renderer.updateConfig((draft) => {
  //     // We build the settings tree with paths of the form
  //     //   ["topics", <topic>, "ns:"<namespace>, "visible"]
  //     // but the config is stored with paths of the form
  //     //   ["topics", <topic>, "namespaces", <namespace>, "visible"]
  //     const actualPath = ["topics", topicName, "namespaces", namespace, fieldName];
  //     set(draft, actualPath, action.payload.value);
  //   });

  //   // Update the MarkersNamespace settings
  //   const renderable = this.renderables.get(topicName);
  //   if (renderable) {
  //     const settings = this.renderer.config.topics[topicName] as
  //       | Partial<LayerSettingsMarker>
  //       | undefined;
  //     const ns = renderable.namespaces.get(namespace);
  //     if (ns) {
  //       const nsSettings = settings?.namespaces?.[namespace] as
  //         | Partial<LayerSettingsMarkerNamespace>
  //         | undefined;
  //       ns.settings = { ...ns.settings, ...nsSettings };
  //     }
  //   }

  //   // Update the settings sidebar
  //   this.updateSettingsTree();
  // };

  handleSceneUpdate = (messageEvent: PartialMessageEvent<SceneUpdate>): void => {
    const topic = messageEvent.topic;
    const sceneUpdates = messageEvent.message;
    const receiveTime = toNanoSec(messageEvent.receiveTime);

    for (const entityMsg of sceneUpdates.entities ?? []) {
      const entity = normalizeSceneEntity(entityMsg);
      this.addEntity(topic, entity, receiveTime);
    }
  };

  // handleMarker = (messageEvent: PartialMessageEvent<Marker>): void => {
  //   const topic = messageEvent.topic;
  //   const marker = normalizeSceneEntity(messageEvent.message);
  //   const receiveTime = toNanoSec(messageEvent.receiveTime);

  //   this.addMarker(topic, marker, receiveTime);
  // };

  addEntity(topic: string, entity: SceneEntity, receiveTime: bigint): void {
    const topicEntities = this._getTopicEntities(topic);
    // const prevNsCount = topicEntities.namespaces.size;
    topicEntities.addOrUpdateEntity(entity, receiveTime);

    // // If the topic has a new namespace, rebuild the settings node for this topic
    // if (prevNsCount !== topicEntities.namespaces.size) {
    //   this.updateSettingsTree();
    // }
  }

  private _getTopicEntities(topic: string): TopicEntities {
    let topicEntities = this.renderables.get(topic);
    if (!topicEntities) {
      const userSettings = this.renderer.config.topics[topic] as
        | Partial<LayerSettingsEntity>
        | undefined;

      topicEntities = new TopicEntities(topic, this.renderer, {
        receiveTime: -1n,
        messageTime: -1n,
        frameId: "",
        pose: makePose(),
        settingsPath: ["topics", topic],
        topic,
        settings: { ...DEFAULT_SETTINGS, ...userSettings },
      });
      this.renderables.set(topic, topicEntities);
      this.add(topicEntities);
    }
    return topicEntities;
  }
}

function normalizeSceneEntity(entity: PartialMessage<SceneEntity>): SceneEntity {
  return {
    timestamp: normalizeTime(entity.timestamp),
    frame_id: entity.frame_id ?? "",
    id: entity.id ?? "",
    lifetime: normalizeTime(entity.lifetime),
    frame_locked: entity.frame_locked ?? false,
    metadata:
      entity.metadata?.map(({ key, value }) => ({ key: key ?? "", value: value ?? "" })) ?? [],
    arrows: entity.arrows?.map(normalizeArrowPrimitive) ?? [],
    cubes: entity.cubes?.map(normalizeCubePrimitive) ?? [],
    spheres: entity.spheres?.map(normalizeSpherePrimitive) ?? [],
    cylinders: entity.cylinders?.map(normalizeCylinderPrimitive) ?? [],
    lines: entity.lines?.map(normalizeLinePrimitive) ?? [],
    triangles: entity.triangles?.map(normalizeTriangleListPrimitive) ?? [],
    texts: entity.texts?.map(normalizeTextPrimitive) ?? [],
    models: entity.models?.map(normalizeModelPrimitive) ?? [],
  };
}

function normalizeArrowPrimitive(arrow: PartialMessage<ArrowPrimitive>): ArrowPrimitive {
  return {
    pose: normalizePose(arrow.pose),
    shaft_length: arrow.shaft_length ?? 0.8,
    shaft_diameter: arrow.shaft_diameter ?? 0.1,
    head_length: arrow.head_length ?? 0.2,
    head_diameter: arrow.head_diameter ?? 0.2,
    color: normalizeColorRGBA(arrow.color),
  };
}

function normalizeCubePrimitive(cube: PartialMessage<CubePrimitive>): CubePrimitive {
  return {
    pose: normalizePose(cube.pose),
    size: normalizeVector3(cube.size),
    color: normalizeColorRGBA(cube.color),
  };
}

function normalizeSpherePrimitive(sphere: PartialMessage<SpherePrimitive>): SpherePrimitive {
  return {
    pose: normalizePose(sphere.pose),
    size: normalizeVector3(sphere.size),
    color: normalizeColorRGBA(sphere.color),
  };
}

function normalizeCylinderPrimitive(
  cylinder: PartialMessage<CylinderPrimitive>,
): CylinderPrimitive {
  return {
    pose: normalizePose(cylinder.pose),
    size: normalizeVector3(cylinder.size),
    bottom_scale: cylinder.bottom_scale ?? 1,
    top_scale: cylinder.top_scale ?? 1,
    color: normalizeColorRGBA(cylinder.color),
  };
}

function normalizeLinePrimitive(line: PartialMessage<LinePrimitive>): LinePrimitive {
  return {
    type: line.type ?? (0 as LineType.LINE_STRIP),
    pose: normalizePose(line.pose),
    thickness: line.thickness ?? 0.05,
    scale_invariant: line.scale_invariant ?? false,
    points: line.points?.map(normalizeVector3) ?? [],
    color: normalizeColorRGBA(line.color),
    colors: normalizeColorRGBAs(line.colors),
    indices: line.indices ?? [],
  };
}

function normalizeTriangleListPrimitive(
  triangles: PartialMessage<TriangleListPrimitive>,
): TriangleListPrimitive {
  return {
    pose: normalizePose(triangles.pose),
    points: triangles.points?.map(normalizeVector3) ?? [],
    color: normalizeColorRGBA(triangles.color),
    colors: normalizeColorRGBAs(triangles.colors),
    indices: triangles.indices ?? [],
  };
}

function normalizeTextPrimitive(text: PartialMessage<TextPrimitive>): TextPrimitive {
  return {
    pose: normalizePose(text.pose),
    billboard: text.billboard ?? true,
    font_size: text.font_size ?? (text.scale_invariant ?? false ? 16 : 0.25),
    scale_invariant: text.scale_invariant ?? false,
    color: normalizeColorRGBA(text.color),
    text: text.text ?? "",
  };
}

function normalizeModelPrimitive(model: PartialMessage<ModelPrimitive>): ModelPrimitive {
  return {
    pose: normalizePose(model.pose),
    scale: normalizeVector3(model.scale),
    color: normalizeColorRGBA(model.color),
    embedded_materials: model.embedded_materials ?? true,
    url: model.url ?? "",
    media_type: model.media_type ?? "",
    data: normalizeByteArray(model.data),
  };
}
