// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as THREE from "three";

import Logger from "@foxglove/log";
import { SettingsTreeFields } from "@foxglove/studio-base/components/SettingsTreeEditor/types";
import PinholeCameraModel from "@foxglove/studio-base/panels/Image/lib/PinholeCameraModel";
import { MutablePoint } from "@foxglove/studio-base/types/Messages";

import { Renderer } from "../Renderer";
import { stringToRgba } from "../color";
import { CameraInfo, Pose, Image, CompressedImage, rosTimeToNanoSec } from "../ros";
import { LayerSettingsImage, LayerType } from "../settings";
import { makePose } from "../transforms/geometry";
import { updatePose } from "../updatePose";
import { missingTransformMessage, MISSING_TRANSFORM } from "./transforms";

const log = Logger.getLogger(__filename);

const CREATE_BITMAP_ERR = "CreateBitmap";

const DEFAULT_DISTANCE = 1;

const DEFAULT_SETTINGS: LayerSettingsImage = {
  visible: true,
  cameraInfoTopic: undefined,
  distance: DEFAULT_DISTANCE,
  color: "#ffffff",
};

type ImageRenderable = THREE.Object3D & {
  userData: {
    topic: string;
    settings: LayerSettingsImage;
    image: Image | CompressedImage;
    pose: Pose;
    srcTime: bigint;
    texture: THREE.Texture | undefined;
    material: THREE.MeshBasicMaterial | undefined;
    geometry: THREE.PlaneGeometry | undefined;
    mesh: THREE.Mesh | undefined;
  };
};

const tempColor = { r: 0, g: 0, b: 0, a: 0 };

export class Images extends THREE.Object3D {
  renderer: Renderer;
  imagesByTopic = new Map<string, ImageRenderable>();
  cameraInfoTopics = new Set<string>();

  constructor(renderer: Renderer) {
    super();
    this.renderer = renderer;

    renderer.setSettingsNodeProvider(LayerType.Image, (topicConfig, topic) => {
      const cur = topicConfig as Partial<LayerSettingsImage>;

      // Build a list of all CameraInfo topics
      const cameraInfoOptions: Array<{ label: string; value: string }> = [];
      for (const cameraInfoTopic of this.cameraInfoTopics) {
        if (cameraInfoTopicMatches(topic.name, cameraInfoTopic)) {
          cameraInfoOptions.push({ label: cameraInfoTopic, value: cameraInfoTopic });
        }
      }

      // prettier-ignore
      const fields: SettingsTreeFields = {
        cameraInfoTopic: { label: "Camera Info", input: "select", options: cameraInfoOptions, value: cur.cameraInfoTopic },
        distance: { label: "Distance", input: "number", value: cur.distance, placeholder: String(DEFAULT_DISTANCE), step: 0.1 },
        color: { label: "Color", input: "rgba", value: cur.color },
      };

      return { icon: "ImageProjection", fields };
    });
  }

  dispose(): void {
    for (const renderable of this.imagesByTopic.values()) {
      renderable.userData.texture?.dispose();
      renderable.userData.material?.dispose();
      renderable.userData.geometry?.dispose();
      renderable.userData.texture = undefined;
      renderable.userData.material = undefined;
      renderable.userData.geometry = undefined;
      renderable.userData.mesh = undefined;
    }
    this.children.length = 0;
    this.imagesByTopic.clear();
  }

  addImageMessage(topic: string, image: Image | CompressedImage): void {
    const userSettings = this.renderer.config.topics[topic] as
      | Partial<LayerSettingsImage>
      | undefined;

    // Create an ImageRenderable for this topic if it doesn't already exist
    let renderable = this.imagesByTopic.get(topic);
    if (!renderable) {
      renderable = new THREE.Object3D() as ImageRenderable;
      renderable.name = topic;
      renderable.userData = {
        topic,
        settings: { ...DEFAULT_SETTINGS, ...userSettings },
        image,
        cameraModel: undefined,
        pose: makePose(),
        srcTime: rosTimeToNanoSec(image.header.stamp),
        texture: undefined,
        material: undefined,
        geometry: undefined,
        mesh: undefined,
      };

      this.add(renderable);
      this.imagesByTopic.set(topic, renderable);
    }

    // Auto-select settings.cameraInfoTopic if it's not already set
    const settings = renderable.userData.settings;
    if (settings.cameraInfoTopic == undefined) {
      autoSelectCameraInfoTopic(settings, topic, this.cameraInfoTopics);
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (settings.cameraInfoTopic != undefined) {
        // Update user settings with the newly selected CameraInfo topic
        const updatedUserSettings = { ...userSettings };
        updatedUserSettings.cameraInfoTopic = settings.cameraInfoTopic;
        this.renderer.config.topics[topic] = updatedUserSettings;

        this.renderer.emit("settingsTreeChange", { path: ["topics", topic] });
      }
    }

    this._updateImageRenderable(renderable, image, renderable.userData.settings);
  }

  addCameraInfoMessage(topic: string, _cameraInfo: CameraInfo): void {
    const updated = !this.cameraInfoTopics.has(topic);
    this.cameraInfoTopics.add(topic);

    const renderable = this.imagesByTopic.get(topic);
    if (renderable) {
      const { image, settings } = renderable.userData;
      this._updateImageRenderable(renderable, image, settings);
    }

    if (updated) {
      this.renderer.emit("settingsTreeChange", { path: ["topics"] });
    }
  }

  setTopicSettings(topic: string, settings: Partial<LayerSettingsImage>): void {
    const renderable = this.imagesByTopic.get(topic);
    if (renderable) {
      this._updateImageRenderable(renderable, renderable.userData.image, settings);
    }
  }

  startFrame(currentTime: bigint): void {
    const renderFrameId = this.renderer.renderFrameId;
    const fixedFrameId = this.renderer.fixedFrameId;
    if (renderFrameId == undefined || fixedFrameId == undefined) {
      this.visible = false;
      return;
    }
    this.visible = true;

    for (const renderable of this.imagesByTopic.values()) {
      renderable.visible = renderable.userData.settings.visible;
      if (!renderable.visible) {
        this.renderer.layerErrors.clearTopic(renderable.userData.topic);
        continue;
      }

      const srcTime = currentTime;
      const frameId = renderable.userData.image.header.frame_id;
      const updated = updatePose(
        renderable,
        this.renderer.transformTree,
        renderFrameId,
        fixedFrameId,
        frameId,
        currentTime,
        srcTime,
      );
      if (!updated) {
        const message = missingTransformMessage(renderFrameId, fixedFrameId, frameId);
        this.renderer.layerErrors.addToTopic(renderable.userData.topic, MISSING_TRANSFORM, message);
      }
    }
  }

  _updateImageRenderable(
    renderable: ImageRenderable,
    image: Image | CompressedImage,
    settings: Partial<LayerSettingsImage>,
  ): void {
    const prevSettings = renderable.userData.settings;
    const newSettings = { ...prevSettings, ...settings };
    const geometrySettingsEqual =
      newSettings.cameraInfoTopic === prevSettings.cameraInfoTopic &&
      newSettings.distance === prevSettings.distance;
    const materialSettingsEqual = newSettings.color === prevSettings.color;
    const topic = renderable.userData.topic;

    renderable.userData.settings = newSettings;

    // Dispose of the current geometry if the settings have changed
    if (!geometrySettingsEqual) {
      renderable.userData.geometry?.dispose();
      renderable.userData.geometry = undefined;
      if (renderable.userData.mesh) {
        renderable.remove(renderable.userData.mesh);
        renderable.userData.mesh = undefined;
      }
    }

    // Create the plane geometry if needed
    if (settings.cameraInfoTopic != undefined && renderable.userData.geometry == undefined) {
      const cameraRenderable = this.renderer.cameras.camerasByTopic.get(settings.cameraInfoTopic);
      const cameraModel = cameraRenderable?.userData.cameraModel;
      if (cameraModel) {
        log.debug(
          `Constructing geometry for ${cameraModel.width}x${cameraModel.height} camera image on "${topic}"`,
        );
        const distance = renderable.userData.settings.distance;
        const geometry = createGeometry(cameraModel, distance);
        renderable.userData.geometry = geometry;
        if (renderable.userData.mesh) {
          renderable.remove(renderable.userData.mesh);
          renderable.userData.mesh = undefined;
        }
      }
    }

    // Create or update the bitmap texture
    if ((image as Partial<CompressedImage>).format) {
      const compressed = image as CompressedImage;
      createBitmap(compressed)
        .then((bitmap) => {
          if (renderable.userData.texture == undefined) {
            log.debug(
              `Creating texture for ${bitmap.width}x${bitmap.height} camera image on "${topic}"`,
            );
            const texture = new THREE.CanvasTexture(
              bitmap,
              THREE.UVMapping,
              THREE.ClampToEdgeWrapping,
              THREE.ClampToEdgeWrapping,
              THREE.NearestFilter,
              THREE.LinearMipmapLinearFilter,
              THREE.RGBAFormat,
              THREE.UnsignedByteType,
            );
            texture.encoding = THREE.sRGBEncoding;
            renderable.userData.texture = texture;
            rebuildMaterial(renderable);
            tryCreateMesh(renderable);
          } else {
            renderable.userData.texture.image = bitmap;
            renderable.userData.texture.needsUpdate = true;
          }

          this.renderer.layerErrors.removeFromTopic(topic, CREATE_BITMAP_ERR);
        })
        .catch((err) => {
          this.renderer.layerErrors.addToTopic(
            topic,
            CREATE_BITMAP_ERR,
            `createBitmap failed: ${err.message}`,
          );
        });
    } else {
      const raw = image as Image;
      // switch (raw.encoding) {
      // }
      throw new Error(`Unhandled ${raw.width}x${raw.height} ${raw.encoding} image`);
    }

    // Create or update the material if needed
    if (!renderable.userData.material || !materialSettingsEqual) {
      rebuildMaterial(renderable);
    }

    // Create/recreate the mesh if needed
    tryCreateMesh(renderable);
  }
}

function tryCreateMesh(renderable: ImageRenderable): void {
  const { topic, mesh, geometry, material } = renderable.userData;
  if (!mesh && geometry && material) {
    log.debug(`Building mesh for camera image on "${topic}"`);
    renderable.userData.mesh = new THREE.Mesh(geometry, renderable.userData.material);
    renderable.add(renderable.userData.mesh);
  }
}

function rebuildMaterial(renderable: ImageRenderable): void {
  const texture = renderable.userData.texture;

  renderable.userData.material?.dispose();
  renderable.userData.material = texture ? createMaterial(texture, renderable) : undefined;

  // Destroy the mesh, it needs to be rebuilt
  if (renderable.userData.mesh) {
    renderable.remove(renderable.userData.mesh);
    renderable.userData.mesh = undefined;
  }
}

async function createBitmap(image: CompressedImage): Promise<ImageBitmap> {
  const bitmapData = new Blob([image.data], { type: `image/${image.format}` });
  // eslint-disable-next-line @typescript-eslint/return-await
  return self.createImageBitmap(bitmapData);
}

function createMaterial(
  texture: THREE.Texture,
  renderable: ImageRenderable,
): THREE.MeshBasicMaterial {
  stringToRgba(tempColor, renderable.userData.settings.color);
  const transparent = tempColor.a < 1;
  const color = new THREE.Color(tempColor.r, tempColor.g, tempColor.b);
  return new THREE.MeshBasicMaterial({
    name: `${renderable.userData.topic}:Material`,
    color,
    map: texture,
    side: THREE.DoubleSide,
    opacity: tempColor.a,
    transparent,
    depthWrite: !transparent,
  });
}

function createGeometry(cameraModel: PinholeCameraModel, depth: number): THREE.PlaneGeometry {
  const width = cameraModel.width;
  const height = cameraModel.height;
  const geometry = new THREE.PlaneGeometry(1, 1, 1, 1);

  const widthSegments = 1;
  const heightSegments = 1;

  const gridX = Math.floor(widthSegments);
  const gridY = Math.floor(heightSegments);

  const gridX1 = gridX + 1;
  const gridY1 = gridY + 1;
  const size = gridX1 * gridY1;

  const segment_width = width / gridX;
  const segment_height = height / gridY;

  const EPS = 1e-3;

  // Rebuild the position buffer for the plane by iterating through the grid and
  // proejcting each pixel space x/y coordinate into a 3D ray and casting out by
  // the user-configured distance setting. UV coordinates are rebuilt so the
  // image is not vertically flipped
  const pixel = { x: 0, y: 0 };
  const p = { x: 0, y: 0, z: 0 };
  const vertices = new Float32Array(size * 3);
  const uvs = new Float32Array(size * 2);
  for (let iy = 0; iy < gridY1; iy++) {
    for (let ix = 0; ix < gridX1; ix++) {
      const vOffset = (iy * gridX1 + ix) * 3;
      const uvOffset = (iy * gridX1 + ix) * 2;

      pixel.x = ix * segment_width;
      pixel.y = iy * segment_height;
      cameraModel.projectPixelTo3dRay(p, cameraModel.rectifyPixel(pixel, pixel));
      multiplyScalar(p, depth);

      vertices[vOffset + 0] = p.x;
      vertices[vOffset + 1] = p.y;
      vertices[vOffset + 2] = p.z - EPS;

      uvs[uvOffset + 0] = ix / gridX;
      uvs[uvOffset + 1] = iy / gridY;
    }
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.attributes.position!.needsUpdate = true;
  geometry.attributes.uv!.needsUpdate = true;

  return geometry;
}

function multiplyScalar(vec: MutablePoint, scalar: number): void {
  vec.x *= scalar;
  vec.y *= scalar;
  vec.z *= scalar;
}

function cameraInfoTopicMatches(topic: string, cameraInfoTopic: string): boolean {
  const imageParts = topic.split("/");
  const infoParts = cameraInfoTopic.split("/");
  if (imageParts.length !== infoParts.length) {
    return false;
  }

  for (let i = 0; i < imageParts.length - 1; i++) {
    if (imageParts[i] !== infoParts[i]) {
      return false;
    }
  }

  return true;
}

function autoSelectCameraInfoTopic(
  output: LayerSettingsImage,
  imageTopic: string,
  cameraInfoTopics: Set<string>,
): void {
  const candidates: string[] = [];
  for (const cameraInfoTopic of cameraInfoTopics) {
    if (cameraInfoTopicMatches(imageTopic, cameraInfoTopic)) {
      candidates.push(cameraInfoTopic);
    }
  }
  candidates.sort();
  output.cameraInfoTopic = candidates[0];
}

// const Float64Type: THREE.TextureDataType = -1;

// function textureDataTypeForArray(array: Iterable<number>): THREE.TextureDataType {
//   if (array instanceof Uint8Array || array instanceof Uint8ClampedArray) {
//     return THREE.UnsignedByteType;
//   } else if (array instanceof Int8Array) {
//     return THREE.ByteType;
//   } else if (array instanceof Uint16Array) {
//     return THREE.UnsignedShortType;
//   } else if (array instanceof Int16Array) {
//     return THREE.ShortType;
//   } else if (array instanceof Uint32Array) {
//     return THREE.UnsignedIntType;
//   } else if (array instanceof Int32Array) {
//     return THREE.IntType;
//   } else if (array instanceof Float32Array) {
//     return THREE.FloatType;
//   } else {
//     return Float64Type;
//   }
// }
