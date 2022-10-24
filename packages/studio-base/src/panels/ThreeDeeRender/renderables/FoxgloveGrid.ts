// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as THREE from "three";

import { toNanoSec } from "@foxglove/rostime";
import { Grid, NumericType, PackedElementField } from "@foxglove/schemas";
import { SettingsTreeAction } from "@foxglove/studio";
import { GRID_DATATYPES } from "@foxglove/studio-base/panels/ThreeDeeRender/foxglove";
import {
  baseColorModeSettingsNode,
  ColorModeSettings,
  getColorConverter,
  autoSelectColorField,
  NEEDS_MIN_MAX,
} from "@foxglove/studio-base/panels/ThreeDeeRender/renderables/pointClouds/colors";
import type { RosValue } from "@foxglove/studio-base/players/types";

import { BaseUserData, Renderable } from "../Renderable";
import { Renderer } from "../Renderer";
import { PartialMessage, PartialMessageEvent, SceneExtension } from "../SceneExtension";
import { SettingsTreeEntry, SettingsTreeNodeWithActionHandler } from "../SettingsManager";
import { rgbaToCssString, rgbaToLinear, stringToRgba } from "../color";
import { normalizePose, normalizeTime, normalizeByteArray } from "../normalizeMessages";
import { BaseSettings } from "../settings";
import { FieldReader, getReader } from "./pointClouds/fieldReaders";

export type LayerSettingsFoxgloveGrid = BaseSettings &
  ColorModeSettings & {
    frameLocked: boolean;
  };
function zeroReader(): number {
  return 0;
}

const floatTextureColorModes = new Set<ColorModeSettings["colorMode"]>(["gradient", "colormap"]);

const INVALID_FOXGLOVE_GRID = "INVALID_FOXGLOVE_GRID";

const DEFAULT_COLOR_MAP = "turbo";
const DEFAULT_FLAT_COLOR = { r: 1, g: 1, b: 1, a: 1 };
const DEFAULT_MIN_COLOR = { r: 100 / 255, g: 47 / 255, b: 105 / 255, a: 1 };
const DEFAULT_MAX_COLOR = { r: 227 / 255, g: 177 / 255, b: 135 / 255, a: 1 };
const DEFAULT_RGB_BYTE_ORDER = "rgba";

const COLOR_MODE_TO_GLSL: Record<string, number> = {
  // need them to be floats for comparision (can't have colormode uniform as int)
  FLAT: 0,
  RGB: 1,
  RGBA: 2,
  GRADIENT: 3,
  COLORMAP: 4,
};

const COLOR_MAP_TO_GLSL: Record<string, number> = {
  // need them to be floats for comparision (can't have colormode uniform as int)
  TURBO: 0,
  RAINBOW: 1,
};

const DEFAULT_SETTINGS: LayerSettingsFoxgloveGrid = {
  visible: false,
  frameLocked: false,
  colorMode: "flat",
  minValue: undefined,
  maxValue: undefined,
  flatColor: rgbaToCssString(DEFAULT_FLAT_COLOR),
  colorField: undefined,
  gradient: [rgbaToCssString(DEFAULT_MIN_COLOR), rgbaToCssString(DEFAULT_MAX_COLOR)],
  colorMap: DEFAULT_COLOR_MAP,
  explicitAlpha: 1,
  rgbByteOrder: DEFAULT_RGB_BYTE_ORDER,
};

interface GridShaderMaterial extends THREE.ShaderMaterial {
  uniforms: {
    map: THREE.IUniform<THREE.DataTexture>;

    colorMode: THREE.IUniform<number>;
    minValue: THREE.IUniform<number>;
    maxValue: THREE.IUniform<number>;

    colorMap: THREE.IUniform<number>;
    colorMapOpacity: THREE.IUniform<number>;

    minGradientColor: THREE.IUniform<THREE.Vector4>;
    maxGradientColor: THREE.IUniform<THREE.Vector4>;
  };
  defines: typeof COLOR_MODE_TO_GLSL &
    typeof COLOR_MAP_TO_GLSL & {
      PICKING: number;
    };
}

export type FoxgloveGridUserData = BaseUserData & {
  settings: LayerSettingsFoxgloveGrid;
  topic: string;
  foxgloveGrid: Grid;
  mesh: THREE.Mesh;
  texture: THREE.DataTexture;
  material: GridShaderMaterial;
  pickingMaterial: THREE.ShaderMaterial;
};

const tempFieldReader = {
  fieldReader: zeroReader as FieldReader,
};
const tempColor = { r: 0, g: 0, b: 0, a: 1 };
const tempMinMaxColor: THREE.Vector2Tuple = [0, 0];
export class FoxgloveGridRenderable extends Renderable<FoxgloveGridUserData> {
  public override dispose(): void {
    this.userData.texture.dispose();
    this.userData.material.dispose();
    this.userData.pickingMaterial.dispose();
  }

  public override details(): Record<string, RosValue> {
    return this.userData.foxgloveGrid;
  }

  public syncPickingMaterial(): void {
    const { pickingMaterial, material } = this.userData;
    pickingMaterial.uniforms = material.uniforms;
    pickingMaterial.needsUpdate = true;
  }

  private _getFieldReader(
    output: { fieldReader: FieldReader },
    foxgloveGrid: Grid,
    settings: LayerSettingsFoxgloveGrid,
  ): boolean {
    let colorReader: FieldReader | undefined;

    const stride = foxgloveGrid.cell_stride;

    // Determine the minimum bytes needed per cell based on offset/size of each
    // field, so we can ensure cell_stride is >= this value
    let minBytesPerCell = 0;

    for (let i = 0; i < foxgloveGrid.fields.length; i++) {
      const field = foxgloveGrid.fields[i]!;
      const { type, offset, name } = field;

      const byteWidth = numericTypeWidth(type);
      minBytesPerCell = Math.max(minBytesPerCell, offset + byteWidth);

      if (name === settings.colorField) {
        // If the selected color mode is rgb/rgba and the field only has one channel with at least a
        // four byte width, force the color data to be interpreted as four individual bytes. This
        // overcomes a common problem where the color field data type is set to float32 or something
        // other than uint32
        const forceType =
          (settings.colorMode === "rgb" || settings.colorMode === "rgba") && byteWidth >= 4
            ? NumericType.UINT32
            : undefined;
        colorReader = getReader(field, stride, forceType);
        if (!colorReader) {
          const typeName = NumericType[type];
          const message = `Grid field "${field.name}" is invalid. type=${typeName}, offset=${field.offset}, stride=${stride}`;
          invalidFoxgloveGridError(this.renderer, this, message);
          return false;
        }
      }
    }

    if (minBytesPerCell > stride) {
      const message = `Grid stride ${stride} is less than minimum bytes per cell ${minBytesPerCell}`;
      invalidFoxgloveGridError(this.renderer, this, message);
      return false;
    }

    output.fieldReader = colorReader ?? zeroReader;
    return true;
  }

  public updateMaterial(settings: LayerSettingsFoxgloveGrid): void {
    const { colorMode } = settings;
    const { material } = this.userData;
    let updated = false;
    let transparent = false;
    if (colorMode === "flat") {
      stringToRgba(tempColor, settings.flatColor);
      transparent = tempColor.a < 1.0;
    } else if (colorMode === "gradient") {
      stringToRgba(tempColor, settings.gradient[0]);
      transparent = tempColor.a < 1.0;

      stringToRgba(tempColor, settings.gradient[1]);
      transparent = transparent || tempColor.a < 1.0;
    } else if (colorMode === "colormap") {
      transparent = settings.explicitAlpha < 1.0;
    }
    if (transparent !== material.transparent) {
      material.depthWrite = !transparent;
      material.transparent = transparent;
      updated = true;
    }
    if (updated) {
      material.needsUpdate = true;
    }
  }

  public updateUniforms(foxgloveGrid: Grid, settings: LayerSettingsFoxgloveGrid): void {
    const { material } = this.userData;
    const {
      uniforms: {
        colorMode,
        colorMap,
        colorMapOpacity,
        minValue,
        maxValue,
        minGradientColor,
        maxGradientColor,
      },
    } = material;

    colorMode.value = COLOR_MODE_TO_GLSL[settings.colorMode.toUpperCase()]!;

    colorMap.value = COLOR_MAP_TO_GLSL[settings.colorMap.toUpperCase()]!;

    colorMapOpacity.value = settings.explicitAlpha;

    minMaxColorValues(
      tempMinMaxColor,
      settings,
      foxgloveGrid.fields.find((field) => settings.colorField === field.name)?.type ??
        NumericType.UNKNOWN,
    );

    const [minColorValue, maxColorValue] = tempMinMaxColor;
    minValue.value = minColorValue;
    maxValue.value = maxColorValue;

    const minColor = stringToRgba(tempColor, settings.gradient[0]);
    rgbaToLinear(minColor, minColor);
    minGradientColor.value.set(minColor.r, minColor.g, minColor.b, minColor.a);

    const maxColor = stringToRgba(tempColor, settings.gradient[1]);
    rgbaToLinear(maxColor, maxColor);
    maxGradientColor.value.set(maxColor.r, maxColor.g, maxColor.b, maxColor.a);
    // material.needsUpdate = true uneccessary because all uniforms are sent to GPU every frame
  }

  public updateTexture(foxgloveGrid: Grid, settings: LayerSettingsFoxgloveGrid): void {
    let texture = this.userData.texture;
    if (!this._getFieldReader(tempFieldReader, foxgloveGrid, settings)) {
      return;
    }

    const { fieldReader } = tempFieldReader;
    const view = new DataView(
      foxgloveGrid.data.buffer,
      foxgloveGrid.data.byteOffset,
      foxgloveGrid.data.byteLength,
    );

    const cols = foxgloveGrid.column_count;
    const rows = foxgloveGrid.data.length / foxgloveGrid.row_stride;
    const sizeChanged = cols !== texture.image.width || rows !== texture.image.height;
    const floatMode = floatTextureColorModes.has(settings.colorMode);
    const formatChanged = floatMode
      ? texture.format !== THREE.RedFormat
      : texture.format !== THREE.RGBAFormat;
    if (formatChanged || sizeChanged) {
      // The image dimensions or format changed, regenerate the texture
      texture.dispose();
      texture = floatMode ? createFloatTexture(foxgloveGrid) : createRGBATexture(foxgloveGrid);
      texture.generateMipmaps = false;
      this.userData.texture = texture;
      this.userData.material.uniforms.map.value = texture;
    }

    if (floatMode) {
      // FLOAT texture handling
      // type of image.data is Uint8ClampedArray, but it is in fact the raw texture data even thought it's
      // meant to be used as an RGBA image data array
      const valueData = texture.image.data as unknown as Float32Array;
      const r32fView = new DataView(valueData.buffer, valueData.byteOffset, valueData.byteLength);
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const offset = y * foxgloveGrid.row_stride + x * foxgloveGrid.cell_stride;
          const colorValue = fieldReader(view, offset);
          const i = y * cols + x;
          const r32fOffset = i * 4;
          r32fView.setFloat32(r32fOffset, colorValue, true);
        }
      }
    } else {
      // RGBA textures
      let hasTransparency = false;
      const colorConverter = getColorConverter(settings, 0, 1);
      const rgba = texture.image.data;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const offset = y * foxgloveGrid.row_stride + x * foxgloveGrid.cell_stride;
          const colorValue = fieldReader(view, offset);
          colorConverter(tempColor, colorValue);
          const i = y * cols + x;
          const rgbaOffset = i * 4;
          rgba[rgbaOffset + 0] = Math.floor(tempColor.r * 255);
          rgba[rgbaOffset + 1] = Math.floor(tempColor.g * 255);
          rgba[rgbaOffset + 2] = Math.floor(tempColor.b * 255);
          rgba[rgbaOffset + 3] = Math.floor(tempColor.a * 255);

          // We cheat a little with transparency: alpha 0 will be handled by the alphaTest setting, so
          // we don't need to set material.transparent = true.
          if (tempColor.a !== 0 && tempColor.a !== 1) {
            hasTransparency = true;
          }
        }
      }
      if (this.userData.material.transparent !== hasTransparency) {
        this.userData.material.transparent = hasTransparency;
        this.userData.material.depthWrite = !hasTransparency;
        this.userData.material.needsUpdate = true;
      }
    }
    this.userData.material.uniforms.map.value.needsUpdate = true;
  }
}

export class FoxgloveGrid extends SceneExtension<FoxgloveGridRenderable> {
  private static geometry: THREE.PlaneGeometry | undefined;
  private fieldsByTopic = new Map<string, string[]>();

  public constructor(renderer: Renderer) {
    super("foxglove.Grid", renderer);

    renderer.addDatatypeSubscriptions(GRID_DATATYPES, this.handleFoxgloveGrid);
  }

  public override settingsNodes(): SettingsTreeEntry[] {
    const configTopics = this.renderer.config.topics;
    const handler = this.handleSettingsAction;
    const entries: SettingsTreeEntry[] = [];
    for (const topic of this.renderer.topics ?? []) {
      if (GRID_DATATYPES.has(topic.schemaName)) {
        const config = (configTopics[topic.name] ?? {}) as Partial<LayerSettingsFoxgloveGrid>;

        const node = baseColorModeSettingsNode(
          this.fieldsByTopic.get(topic.name) ?? [],
          config,
          topic,
          DEFAULT_SETTINGS,
          { supportsRgbModes: true },
        );
        node.icon = "Cells";
        node.fields.frameLocked = {
          label: "Frame lock",
          input: "boolean",
          value: config.frameLocked ?? DEFAULT_SETTINGS.frameLocked,
        };
        (node as SettingsTreeNodeWithActionHandler).handler = handler;
        entries.push({
          path: ["topics", topic.name],
          node,
        });
      }
    }
    return entries;
  }

  public override handleSettingsAction = (action: SettingsTreeAction): void => {
    const path = action.payload.path;
    if (action.action !== "update" || path.length !== 3) {
      return;
    }

    this.saveSetting(path, action.payload.value);

    // Update the renderable
    const topicName = path[1]!;
    const renderable = this.renderables.get(topicName);
    if (renderable) {
      const settings = this.renderer.config.topics[topicName] as
        | Partial<LayerSettingsFoxgloveGrid>
        | undefined;
      renderable.userData.settings = { ...DEFAULT_SETTINGS, ...settings };

      renderable.updateMaterial(renderable.userData.settings);
      renderable.updateUniforms(renderable.userData.foxgloveGrid, renderable.userData.settings);
      if (action.payload.path[2] === "colorMode" || action.payload.path[2] === "colorField") {
        // needs to recalculate texture when colorMode or colorField changes
        // technically it doesn't if it's going between gradient and colorMap, but since it's an infrequent user-action it's not a big hit
        renderable.updateTexture(renderable.userData.foxgloveGrid, renderable.userData.settings);
      }
      renderable.syncPickingMaterial();
    }
  };

  private handleFoxgloveGrid = (messageEvent: PartialMessageEvent<Grid>): void => {
    const topic = messageEvent.topic;
    const foxgloveGrid = normalizeFoxgloveGrid(messageEvent.message);
    const receiveTime = toNanoSec(messageEvent.receiveTime);

    let renderable = this.renderables.get(topic);
    if (!renderable) {
      // Set the initial settings from default values merged with any user settings
      const userSettings = this.renderer.config.topics[topic] as
        | Partial<LayerSettingsFoxgloveGrid>
        | undefined;
      const settings = { ...DEFAULT_SETTINGS, ...userSettings };
      if (settings.colorField == undefined) {
        autoSelectColorField(settings, foxgloveGrid.fields);
        // Update user settings with the newly selected color field
        this.renderer.updateConfig((draft) => {
          const updatedUserSettings = { ...userSettings };
          updatedUserSettings.colorField = settings.colorField;
          updatedUserSettings.colorMode = settings.colorMode;
          updatedUserSettings.colorMap = settings.colorMap;
          draft.topics[topic] = updatedUserSettings;
        });
      }

      // Check color
      const texture = floatTextureColorModes.has(settings.colorMode)
        ? createFloatTexture(foxgloveGrid)
        : createRGBATexture(foxgloveGrid);
      const mesh = createMesh(topic, texture);
      const material = mesh.material as GridShaderMaterial;
      const pickingMaterial = mesh.userData.pickingMaterial as THREE.ShaderMaterial;

      // Create the renderable
      renderable = new FoxgloveGridRenderable(topic, this.renderer, {
        receiveTime,
        messageTime: toNanoSec(foxgloveGrid.timestamp),
        frameId: this.renderer.normalizeFrameId(foxgloveGrid.frame_id),
        pose: foxgloveGrid.pose,
        settingsPath: ["topics", topic],
        settings,
        topic,
        foxgloveGrid,
        mesh,
        texture,
        material,
        pickingMaterial,
      });
      renderable.add(mesh);

      this.add(renderable);
      this.renderables.set(topic, renderable);
    }

    let fields = this.fieldsByTopic.get(topic);
    if (!fields || fields.length !== foxgloveGrid.fields.length) {
      fields = foxgloveGrid.fields.map((field) => field.name);
      this.fieldsByTopic.set(topic, fields);
      this.updateSettingsTree();
    }

    this._updateFoxgloveGridRenderable(
      renderable,
      foxgloveGrid,
      receiveTime,
      renderable.userData.settings,
    );
  };

  private _updateFoxgloveGridRenderable(
    renderable: FoxgloveGridRenderable,
    foxgloveGrid: Grid,
    receiveTime: bigint,
    settings: LayerSettingsFoxgloveGrid,
  ): void {
    renderable.userData.foxgloveGrid = foxgloveGrid;
    renderable.userData.pose = foxgloveGrid.pose;
    renderable.userData.receiveTime = receiveTime;
    renderable.userData.messageTime = toNanoSec(foxgloveGrid.timestamp);
    renderable.userData.frameId = this.renderer.normalizeFrameId(foxgloveGrid.frame_id);
    if (foxgloveGrid.fields.length === 0) {
      invalidFoxgloveGridError(this.renderer, renderable, `Grid has no fields to color by`);
      return;
    }
    const { cell_stride, row_stride, column_count: cols } = foxgloveGrid;
    const rows = foxgloveGrid.data.byteLength / row_stride;

    if (Math.floor(cols) !== cols || Math.floor(rows) !== rows) {
      const message = `Grid column count (${foxgloveGrid.column_count}) or row count (${rows} = data.byteLength ${foxgloveGrid.data.byteLength} / row_stride ${row_stride}) is not an integer.`;
      invalidFoxgloveGridError(this.renderer, renderable, message);
      return;
    }

    if (cell_stride * cols > row_stride) {
      const message = `Grid row_stride (${row_stride}) does not allow for requisite column_count (${cols}) with cell stride (${cell_stride}). Minimum requisite bytes in row_stride needed: (${
        cols * cell_stride
      }) `;
      invalidFoxgloveGridError(this.renderer, renderable, message);
      return;
    }

    renderable.updateMaterial(settings);
    renderable.updateUniforms(foxgloveGrid, settings);
    renderable.updateTexture(foxgloveGrid, settings);

    renderable.scale.set(foxgloveGrid.cell_size.x * cols, foxgloveGrid.cell_size.y * rows, 1);

    renderable.syncPickingMaterial();
  }

  public static Geometry(): THREE.PlaneGeometry {
    if (!FoxgloveGrid.geometry) {
      FoxgloveGrid.geometry = new THREE.PlaneGeometry(1, 1, 1, 1);
      FoxgloveGrid.geometry.translate(0.5, 0.5, 0);
      FoxgloveGrid.geometry.computeBoundingSphere();
    }
    return FoxgloveGrid.geometry;
  }
}

function invalidFoxgloveGridError(
  renderer: Renderer,
  renderable: FoxgloveGridRenderable,
  message: string,
): void {
  renderer.settings.errors.addToTopic(renderable.userData.topic, INVALID_FOXGLOVE_GRID, message);
}

function createRGBATexture(foxgloveGrid: Grid): THREE.DataTexture {
  const { column_count: cols, row_stride } = foxgloveGrid;
  const rows = foxgloveGrid.data.byteLength / row_stride;
  const size = cols * rows;
  const rgba = new Uint8ClampedArray(size * 4);
  const texture = new THREE.DataTexture(
    rgba,
    cols,
    rows,
    THREE.RGBAFormat,
    THREE.UnsignedByteType,
    THREE.UVMapping,
    THREE.ClampToEdgeWrapping,
    THREE.ClampToEdgeWrapping,
    THREE.NearestFilter,
    THREE.LinearFilter,
    1,
    THREE.LinearEncoding, // FoxgloveGrid carries linear grayscale values, not sRGB
  );
  texture.generateMipmaps = false;
  return texture;
}

function createFloatTexture(foxgloveGrid: Grid): THREE.DataTexture {
  const { column_count: cols, row_stride } = foxgloveGrid;
  const rows = foxgloveGrid.data.byteLength / row_stride;
  const size = cols * rows;
  const data = new Float32Array(size);
  const texture = new THREE.DataTexture(
    data,
    cols,
    rows,
    THREE.RedFormat,
    THREE.FloatType,
    THREE.UVMapping,
    THREE.ClampToEdgeWrapping,
    THREE.ClampToEdgeWrapping,
    THREE.NearestFilter,
    THREE.LinearFilter,
    1,
    THREE.LinearEncoding, // FoxgloveGrid carries linear grayscale values, not sRGB
  );
  texture.generateMipmaps = false;
  return texture;
}

function createMesh(topic: string, texture: THREE.DataTexture): THREE.Mesh {
  // Create the texture, material, and mesh
  const material = createMaterial(texture, topic) as GridShaderMaterial;
  const pickingMaterial = createPickingMaterial(material);
  const mesh = new THREE.Mesh(FoxgloveGrid.Geometry(), material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  // This overrides the picking material used for `mesh`. See Picker.ts
  mesh.userData.pickingMaterial = pickingMaterial;
  return mesh;
}

function numericTypeWidth(type: NumericType): number {
  switch (type) {
    case NumericType.INT8:
    case NumericType.UINT8:
      return 1;
    case NumericType.INT16:
    case NumericType.UINT16:
      return 2;
    case NumericType.INT32:
    case NumericType.UINT32:
    case NumericType.FLOAT32:
      return 4;
    case NumericType.FLOAT64:
      return 8;
    default:
      return 0;
  }
}

function createMaterial(texture: THREE.DataTexture, topic: string): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    name: `${topic}:Material`,
    // Enable alpha clipping. Fully transparent (alpha=0) pixels are skipped
    // even when transparency is disabled
    alphaTest: 1e-4,
    side: THREE.DoubleSide,
    // needs to always be off to prevent z-fighting
    depthWrite: true,
    uniforms: {
      objectId: { value: [NaN, NaN, NaN, NaN] },
      colorMode: { value: COLOR_MODE_TO_GLSL.RGBA },
      colorMap: { value: COLOR_MAP_TO_GLSL.TURBO },
      colorMapOpacity: { value: 1.0 },
      minValue: { value: 0.0 },
      maxValue: { value: 1.0 },
      minGradientColor: { value: new THREE.Vector4() },
      maxGradientColor: { value: new THREE.Vector4() },
      map: { value: texture },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    defines: {
      ...COLOR_MODE_TO_GLSL,
      ...COLOR_MAP_TO_GLSL,
      PICKING: 0,
    },
    fragmentShader: /* glsl */ `
      uniform vec4 objectId;

      uniform sampler2D map;

      uniform int colorMode;
      uniform float minValue;
      uniform float maxValue;

      uniform int colorMap;
      uniform float colorMapOpacity;

      uniform vec4 minGradientColor;
      uniform vec4 maxGradientColor;

      varying vec2 vUv;

      // fifth-order polynomial approximation of Turbo based on:
      // https://observablehq.com/@mbostock/turbo
      vec3 turbo(float x) {
        float r = 0.1357 + x * ( 4.5974 - x * ( 42.3277 - x * ( 130.5887 - x * ( 150.5666 - x * 58.1375 ))));
        float g = 0.0914 + x * ( 2.1856 + x * ( 4.8052 - x * ( 14.0195 - x * ( 4.2109 + x * 2.7747 ))));
        float b = 0.1067 + x * ( 12.5925 - x * ( 60.1097 - x * ( 109.0745 - x * ( 88.5066 - x * 26.8183 ))));
        return vec3(r,g,b);
      }

      vec3 rainbow(float pct) {
        vec3 colorOut = vec3(0.0);
        float h = (1.0 - clamp(pct, 0.0, 1.0)) * 5.0 + 1.0;
        float i = floor(h);
        float f = mod(h, 1.0);
        // if i is even
        if (mod(i, 2.0) < 1.0) {
          f = 1.0 - f;
        }
        float n = (1.0 - f);

        if (i <= 1.0) {
          colorOut.r = n;
          colorOut.g = 0.0;
          colorOut.b = 1.0;
        } else if (i == 2.0) {
          colorOut.r = 0.0;
          colorOut.g = n;
          colorOut.b = 1.0;
        } else if (i == 3.0) {
          colorOut.r = 0.0;
          colorOut.g = 1.0;
          colorOut.b = n;
        } else if (i == 4.0) {
          colorOut.r = n;
          colorOut.g = 1.0;
          colorOut.b = 0.0;
        } else {
          colorOut.r = 1.0;
          colorOut.g = n;
          colorOut.b = 0.0;
        }
        return colorOut;
      }

      void main() {
        vec4 color = texture2D(map, vUv);
        if(colorMode == RGBA || colorMode == RGB || colorMode == FLAT) {
          // colors that are coming from CPU need to be converted
          gl_FragColor = LinearTosRGB(color);
        } else {
          float delta = max(maxValue - minValue, 0.00001);
          float colorValue = color.r;
          float normalizedColorValue = (colorValue - minValue) / delta;
          if(colorMode == GRADIENT) {
            // weight each color by its alpha
            vec4 weightedMinColor = vec4(minGradientColor.rgb * minGradientColor.a, minGradientColor.a);
            vec4 weightedMaxColor = vec4(maxGradientColor.rgb * maxGradientColor.a, maxGradientColor.a);
            vec4 finalColor = mix(weightedMinColor, weightedMaxColor, normalizedColorValue);
            // gradient computation takes place in linear colorspace and must be translated to sRGB
            gl_FragColor = LinearTosRGB(finalColor);
          } else if(colorMode == COLORMAP) {
            // colormap
            // don't need to go through LinearTosRGB because they are created in the shader
            if(colorMap == TURBO) {
              gl_FragColor = vec4(turbo(normalizedColorValue), colorMapOpacity);
            } else if(colorMap == RAINBOW) {
              gl_FragColor = vec4(rainbow(normalizedColorValue), colorMapOpacity);
            }
          }
        }
        if(PICKING == 1) {
          if(gl_FragColor.a < 0.00001) {
            discard;
          }
          gl_FragColor = objectId;
        }
      }
    `,
  });
}

function createPickingMaterial(originalMaterial: GridShaderMaterial): THREE.ShaderMaterial {
  const material = new THREE.ShaderMaterial();
  material.copy(originalMaterial);
  material.name = "";
  material.defines.PICKING = 1;
  material.uniformsNeedUpdate = true;
  material.needsUpdate = true;
  return material;
}

function normalizePackedElementField(
  field: PartialMessage<PackedElementField> | undefined,
): PackedElementField {
  return {
    name: field?.name ?? "",
    offset: field?.offset ?? 0,
    type: field?.type ?? 0,
  };
}

function normalizeFoxgloveGrid(message: PartialMessage<Grid>): Grid {
  return {
    timestamp: normalizeTime(message.timestamp),
    pose: normalizePose(message.pose),
    frame_id: message.frame_id ?? "",
    row_stride: message.row_stride ?? 0,
    cell_stride: message.cell_stride ?? 0,
    column_count: message.column_count ?? 0,
    cell_size: {
      x: message.cell_size?.x ?? 1,
      y: message.cell_size?.y ?? 1,
    },
    fields: message.fields?.map(normalizePackedElementField) ?? [],
    data: normalizeByteArray(message.data),
  };
}

function minMaxColorValues(
  output: THREE.Vector2Tuple,
  settings: LayerSettingsFoxgloveGrid,
  numericType: NumericType,
): void {
  if (!NEEDS_MIN_MAX.includes(settings.colorMode)) {
    return;
  }

  const [numericMin, numericMax] = NumericTypeMinMaxValueMap[numericType];
  const minColorValue = settings.minValue ?? numericMin;
  const maxColorValue = settings.maxValue ?? numericMax;
  output[0] = minColorValue;
  output[1] = maxColorValue;
}

const NumericTypeMinMaxValueMap: Record<NumericType, [number, number]> = {
  [NumericType.UNKNOWN]: [0, 1.0],
  [NumericType.UINT8]: [0, 255],
  [NumericType.UINT16]: [0, 65535],
  [NumericType.UINT32]: [0, Math.pow(2, 32) - 1],
  [NumericType.INT8]: [-128, 127],
  [NumericType.INT16]: [-Math.pow(2, 16 - 1), -Math.pow(2, 16 - 1) - 1],
  [NumericType.INT32]: [-Math.pow(2, 32 - 1), -Math.pow(2, 32 - 1) - 1],
  [NumericType.FLOAT32]: [0, 1.0],
  [NumericType.FLOAT64]: [0, 1.0],
};
