// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  UrdfGeometryMesh,
  UrdfRobot,
  UrdfVisual,
  parseRobot,
  UrdfCollider,
} from "@foxglove/den/urdf";
import Logger from "@foxglove/log";
import { Pose } from "@foxglove/regl-worldview";
import { toNanoSec } from "@foxglove/rostime";
import { SettingsTreeAction, SettingsTreeFields } from "@foxglove/studio";
import { eulerToQuaternion } from "@foxglove/studio-base/util/geometry";

import { BaseUserData, Renderable } from "../Renderable";
import { Renderer } from "../Renderer";
import { PartialMessageEvent, SceneExtension } from "../SceneExtension";
import { SettingsTreeEntry } from "../SettingsManager";
import { rgbaToCssString } from "../color";
import { ColorRGBA, Marker, MarkerAction, MarkerType, Quaternion, Vector3 } from "../ros";
import { BaseSettings } from "../settings";
import { makePose } from "../transforms";
import { RenderableCube } from "./markers/RenderableCube";
import { RenderableCylinder } from "./markers/RenderableCylinder";
import { RenderableMeshResource } from "./markers/RenderableMeshResource";
import { RenderableSphere } from "./markers/RenderableSphere";

const log = Logger.getLogger(__filename);

const PARSE_URDF_ERR = "ParseUrdf";

const VEC3_ONE = { x: 1, y: 1, z: 1 };
const DEFAULT_COLOR = { r: 36 / 255, g: 142 / 255, b: 255 / 255, a: 1 };

const DEFAULT_COLOR_STR = rgbaToCssString(DEFAULT_COLOR);

export type LayerSettingsUrdf = BaseSettings & {
  color: string | undefined;
};

const DEFAULT_SETTINGS: LayerSettingsUrdf = {
  visible: true,
  color: undefined,
};

export type UrdfUserData = BaseUserData & {
  settings: LayerSettingsUrdf;
  urdf: string;
  renderables: Map<string, Renderable>;
};

type TransformLink = {
  parent: string;
  child: string;
  translation: Vector3;
  rotation: Quaternion;
};

type ParsedUrdf = {
  robot: UrdfRobot;
  transforms: TransformLink[];
};

export class UrdfRenderable extends Renderable<UrdfUserData> {
  override dispose(): void {
    // this.userData.model?.dispose();
    super.dispose();
  }
}

export class Urdfs extends SceneExtension<UrdfRenderable> {
  constructor(renderer: Renderer) {
    super("foxglove.Urdfs", renderer);

    renderer.addTopicSubscription("/robot_description", this.handleRobotDescription);
    renderer.on("parametersChange", this.handleParametersChange);
  }

  override settingsNodes(): SettingsTreeEntry[] {
    const configTopics = this.renderer.config.topics;
    const handler = this.handleSettingsAction;
    const entries: SettingsTreeEntry[] = [];

    for (const topic of this.renderer.topics ?? []) {
      if (topic.name === "/robot_description") {
        const config = (configTopics[topic.name] ?? {}) as Partial<LayerSettingsUrdf>;

        const fields: SettingsTreeFields = {
          color: { label: "Color", input: "rgba", value: config.color ?? DEFAULT_COLOR_STR },
        };

        entries.push({
          path: ["topics", topic.name],
          node: {
            label: topic.name,
            icon: "PrecisionManufacturing",
            fields,
            visible: config.visible ?? true,
            handler,
          },
        });
      }
    }

    for (const [layerId, layerConfig] of Object.entries(this.renderer.config.layers)) {
      if (layerConfig?.layerId === "foxglove.Urdf") {
        const config = layerConfig as Partial<LayerSettingsUrdf>;

        const fields: SettingsTreeFields = {
          color: { label: "Color", input: "rgba", value: config.color ?? DEFAULT_COLOR_STR },
        };

        entries.push({
          path: ["layers", layerId],
          node: {
            label: layerId,
            icon: "PrecisionManufacturing",
            fields,
            visible: config.visible ?? true,
            handler,
          },
        });
      }
    }

    return entries;
  }

  handleSettingsAction = (_action: SettingsTreeAction): void => {
    // const path = action.payload.path;
    // if (action.action !== "update" || path.length !== 3) {
    //   return;
    // }
    // this.saveSetting(path, action.payload.value);
    // // Update the renderable
    // const topicName = path[1]!;
    // const renderable = this.renderables.get(topicName);
    // if (renderable) {
    //   const settings = this.renderer.config.topics[topicName] as
    //     | Partial<LayerSettingsPolygon>
    //     | undefined;
    //   renderable.userData.settings = { ...renderable.userData.settings, ...settings };
    //   this._updatePolygonRenderable(
    //     renderable,
    //     renderable.userData.polygonStamped,
    //     renderable.userData.receiveTime,
    //   );
    // }
  };

  handleRobotDescription = (messageEvent: PartialMessageEvent<{ data: string }>): void => {
    const robotDescription = messageEvent.message.data;
    if (typeof robotDescription !== "string") {
      return;
    }
    const receiveTime = toNanoSec(messageEvent.receiveTime);
    this._loadUrdf("/robot_description", receiveTime, robotDescription);
  };

  handleParametersChange = (parameters: ReadonlyMap<string, unknown> | undefined): void => {
    const robotDescription = parameters?.get("/robot_description");
    if (typeof robotDescription !== "string") {
      return;
    }
    const receiveTime = 0n;
    this._loadUrdf("/robot_description", receiveTime, robotDescription);
  };

  private _loadUrdf(layerId: string, receiveTime: bigint, urdf: string): void {
    let renderable = this.renderables.get(layerId);
    if (renderable && renderable.userData.urdf === urdf) {
      return;
    }

    const isTopic = layerId === "/robot_description";
    const frameId = this.renderer.fixedFrameId ?? ""; // Unused
    const settingsPath = isTopic ? ["topics", "/robot_description"] : ["layers", layerId];
    const userSettings = isTopic
      ? this.renderer.config.topics[layerId]
      : this.renderer.config.layers[layerId];
    const settings = { ...DEFAULT_SETTINGS, ...userSettings };

    if (!renderable) {
      renderable = new UrdfRenderable(layerId, this.renderer, {
        urdf,
        renderables: new Map(),
        receiveTime,
        messageTime: receiveTime,
        frameId,
        pose: makePose(),
        settingsPath,
        settings,
      });
      this.add(renderable);
      this.renderables.set(layerId, renderable);
    }

    renderable.userData.urdf = urdf;
    renderable.userData.receiveTime = receiveTime;
    renderable.userData.settings = settings;
    const loadedRenderable = renderable;

    parseUrdf(urdf)
      .then((parsed) => this._loadRobot(loadedRenderable, parsed))
      .catch((unknown) => {
        const err = unknown as Error;
        log.error(`Failed to parse URDF: ${err.message}`);
        this.renderer.settings.errors.add(
          settingsPath,
          PARSE_URDF_ERR,
          `Failed to parse URDF: ${err.message}`,
        );
      });
  }

  private _loadRobot(renderable: UrdfRenderable, { robot, transforms }: ParsedUrdf): void {
    const renderer = this.renderer;

    // Import all transforms from the URDF into the scene
    for (const { parent, child, translation, rotation } of transforms) {
      renderer.addTransform(parent, child, 0n, translation, rotation);
    }

    // Dispose any existing renderables
    for (const childRenderable of renderable.userData.renderables.values()) {
      childRenderable.dispose();
    }
    renderable.children.length = 0;
    renderable.userData.renderables.clear();

    // Create a renderable for each link
    for (const link of robot.links.values()) {
      const frameId = link.name;

      let i = 0;
      for (const visual of link.visuals) {
        const childRenderable = createRenderable(visual, robot, i++, frameId, renderer);
        renderable.userData.renderables.set(childRenderable.name, childRenderable);
        renderable.add(childRenderable);
      }

      if (link.visuals.length === 0 && link.colliders.length > 0) {
        // If there are no visuals, but there are colliders, render those instead
        i = 0;
        for (const collider of link.colliders) {
          const childRenderable = createRenderable(collider, robot, i++, frameId, renderer);
          renderable.userData.renderables.set(childRenderable.name, childRenderable);
          renderable.add(childRenderable);
        }
      }
    }
  }
}

async function parseUrdf(text: string): Promise<{ robot: UrdfRobot; transforms: TransformLink[] }> {
  const fileFetcher = getFileFetch();

  try {
    log.debug(`Parsing ${text.length} byte URDF`);
    const robot = await parseRobot(text, fileFetcher);

    const transforms = Array.from(robot.joints.values(), (joint) => {
      const translation = joint.origin.xyz;
      const rotation = eulerToQuaternion(joint.origin.rpy);
      const transformLink: TransformLink = {
        parent: joint.parent,
        child: joint.child,
        translation,
        rotation,
      };
      return transformLink;
    });

    return { robot, transforms };
  } catch (err) {
    throw new Error(`Failed to parse ${text.length} byte URDF: ${err}`);
  }
}

function getFileFetch(): (url: string) => Promise<string> {
  return async (url: string) => {
    try {
      log.debug(`fetch(${url}) requested`);
      const res = await fetch(url);
      return await res.text();
    } catch (err) {
      throw new Error(`Failed to fetch "${url}": ${err}`);
    }
  };
}

function createRenderable(
  collider: UrdfCollider,
  robot: UrdfRobot,
  id: number,
  frameId: string,
  renderer: Renderer,
): Renderable {
  const name = `${frameId}-${id}-${collider.geometry.geometryType}`;
  const orientation = eulerToQuaternion(collider.origin.rpy);
  const pose = { position: collider.origin.xyz, orientation };
  const color = getColor(collider, robot);
  const type = collider.geometry.geometryType;
  switch (type) {
    case "box": {
      const scale = collider.geometry.size;
      const marker = createMarker(frameId, MarkerType.CUBE, pose, scale, color);
      return new RenderableCube(name, marker, undefined, renderer);
    }
    case "cylinder": {
      const cylinder = collider.geometry;
      const scale = { x: cylinder.radius * 2, y: cylinder.radius * 2, z: cylinder.length };
      const marker = createMarker(frameId, MarkerType.CUBE, pose, scale, color);
      return new RenderableCylinder(name, marker, undefined, renderer);
    }
    case "sphere": {
      const sphere = collider.geometry;
      const scale = { x: sphere.radius * 2, y: sphere.radius * 2, z: sphere.radius * 2 };
      const marker = createMarker(frameId, MarkerType.CUBE, pose, scale, color);
      return new RenderableSphere(name, marker, undefined, renderer);
    }
    case "mesh": {
      const marker = createMeshMarker(frameId, pose, collider, collider.geometry, color);
      return new RenderableMeshResource(name, marker, undefined, renderer);
    }
    default:
      throw new Error(`Unrecognized visual geometryType: ${type}`);
  }
}

function getColor(visual: UrdfVisual, robot: UrdfRobot): ColorRGBA {
  if (!visual.material) {
    return DEFAULT_COLOR;
  }
  if (visual.material.color) {
    return visual.material.color;
  }
  if (visual.material.name) {
    return robot.materials.get(visual.material.name)?.color ?? DEFAULT_COLOR;
  }
  return DEFAULT_COLOR;
}

function createMarker(
  frameId: string,
  type: MarkerType,
  pose: Pose,
  scale: Vector3,
  color: ColorRGBA,
): Marker {
  return {
    header: { frame_id: frameId, stamp: { sec: 0, nsec: 0 } },
    ns: "",
    id: 0,
    type,
    action: MarkerAction.ADD,
    pose,
    scale,
    color,
    lifetime: { sec: 0, nsec: 0 },
    frame_locked: true,
    points: [],
    colors: [],
    text: "",
    mesh_resource: "",
    mesh_use_embedded_materials: false,
  };
}

function createMeshMarker(
  frameId: string,
  pose: Pose,
  visual: UrdfVisual,
  mesh: UrdfGeometryMesh,
  color: ColorRGBA,
): Marker {
  const scale = mesh.scale ?? VEC3_ONE;
  return {
    header: { frame_id: frameId, stamp: { sec: 0, nsec: 0 } },
    ns: "",
    id: 0,
    type: MarkerType.MESH_RESOURCE,
    action: MarkerAction.ADD,
    pose,
    scale,
    color,
    lifetime: { sec: 0, nsec: 0 },
    frame_locked: true,
    points: [],
    colors: [],
    text: "",
    mesh_resource: mesh.filename,
    mesh_use_embedded_materials:
      visual.material == undefined ||
      // RViz ignores the URDF-specified material when the Collada mesh has an embedded material
      mesh.filename.endsWith(".dae"),
  };
}
