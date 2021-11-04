// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

// The STL parsing logic is adapted from the MIT licensed ts-three-stl-loader at
// <https://github.com/GarrettCannon/ts-three-stl-loader/blob/8db9d94fb609aa010555b70f99c37083c2ca0814/src/index.ts>

import { GlbModel } from "@foxglove/studio-base/panels/ThreeDimensionalViz/utils/GlbModel";
import { GlTf, MeshPrimitive } from "@foxglove/studio-base/panels/ThreeDimensionalViz/utils/gltf";

const UNSIGNED_SHORT = 5123;
const FLOAT = 5126;
const CLAMP_TO_EDGE = 33071;
const LINEAR = 9729;
const DEFAULT_COLOR = [36 / 255, 142 / 255, 255 / 255, 1];

type UpAxis = "X_UP" | "Y_UP" | "Z_UP";

type Asset = {
  scale: number;
  upAxis: UpAxis;
};

type FloatArray = {
  id: string;
  data: Float32Array;
};

type FloatSource = {
  id: string;
  array: FloatArray;
  stride?: number;
};

type PrimitiveInput = {
  semantic: string;
  source: string;
  offset: number;
  set?: number;
};

type GeometryVertices = {
  id: string;
  /**
   * Maps semantic to source id
   */
  inputs: Map<string, string>;
};

type GeometryPrimitive = {
  type: "triangles";
  material: string;
  count: number;
  inputs: Map<string, PrimitiveInput>;
  stride: number;
  hasUV: boolean;
  p: Uint16Array;
};

type LibraryImage = {
  id: string;
  initFrom: string;
  data?: ArrayBuffer;
};

type LibraryGeometry = {
  id: string;
  name: string;
  sources: Map<string, FloatSource>;
  vertices: Map<string, GeometryVertices>;
  primitives: GeometryPrimitive[];
};

export async function parseDaeToGlb(buffer: ArrayBuffer): Promise<GlbModel> {
  const text = new TextDecoder().decode(buffer);
  const xml = new DOMParser().parseFromString(text, "application/xml");

  const parserError = xml.getElementsByTagName("parsererror")[0];
  if (parserError) {
    const errorElement = getElementByTagName(parserError, "div");
    let errorText;
    if (errorElement) {
      errorText = errorElement.textContent;
    } else {
      errorText = parserErrorToText(parserError);
    }
    throw new Error(`Failed to parse ${buffer.byteLength} byte COLLADA .dae file: ${errorText}`);
  }

  const collada = getElementByTagName(xml, "COLLADA");
  if (!collada) {
    throw new Error(`Required <COLLADA> element not found`);
  }

  const version = getAttribute(collada, "version");
  const asset = parseAsset(collada);

  const images = parseImages(collada);
  // const bitmaps = await Promise.all(images.map(async (image) => await loadImage(image.initFrom)));
  const imageIdsToIndexes = new Map<string, number>();
  for (let i = 0; i < images.length; i++) {
    imageIdsToIndexes.set(images[i]!.id, i);
  }

  const gltf: GlTf = {
    accessors: [],
    asset: {
      generator: "Foxglove Studio COLLADA parser",
      version: "2.0",
      extras: { colladaVersion: version },
    },
    bufferViews: [],
    buffers: [],
    materials: [
      {
        pbrMetallicRoughness: {
          baseColorFactor: DEFAULT_COLOR,
          metallicFactor: 0,
          roughnessFactor: 1,
        },
      },
    ],
    images: undefined, // unused, <GLTFScene> wants images as loaded ImageBitmaps
    meshes: [],
    nodes: [],
    samplers: [{ minFilter: LINEAR, wrapS: CLAMP_TO_EDGE, wrapT: CLAMP_TO_EDGE }],
    scene: 0,
    scenes: [{ nodes: [] }],
    // textures: images.map((image, i) => ({ name: image.id, source: i, sampler: 0 })),
  };

  const glb = {
    json: gltf,
    accessors: [],
    images: [],
    // images: bitmaps,
  };

  const geometries = parseGeometries(collada);
  for (const geometry of geometries) {
    geometryToGlb(geometry, glb);
  }

  const scene = gltf.scenes![0]!;
  const scale = [asset.scale, asset.scale, asset.scale];
  const rotation = upAxisToRotation(asset.upAxis);

  // TODO: Parse nodes from .dae
  for (let i = 0; i < geometries.length; i++) {
    const geometry = geometries[i]!;
    gltf.nodes!.push({ name: geometry.name, mesh: i, scale, rotation });
    scene.nodes!.push(i);
  }

  return glb;
}

function geometryToGlb(geometry: LibraryGeometry, glb: GlbModel): void {
  const sharedAttributes: { [k: string]: number } = {};
  for (const vertices of geometry.vertices.values()) {
    for (const [semantic, sourceName] of vertices.inputs.entries()) {
      const source = findFloatSource(sourceName, geometry);
      sharedAttributes[semantic] = sourceToAccessorId(source, glb);
    }
  }

  const primitives: MeshPrimitive[] = [];
  for (const primitive of geometry.primitives) {
    // What a hack!
    const p = new Uint16Array(primitive.p.length / 3);
    for (let i = 0; i < p.length; i++) {
      p[i] = primitive.p[i * 3]!;
    }

    const indices = indicesToAccessorId(p, glb);
    const attributes = { ...sharedAttributes };
    for (const input of primitive.inputs.values()) {
      const id = primitiveInputId(input);
      const source = findFloatSource(input.source, geometry);
      attributes[id] = sourceToAccessorId(source, glb);
    }
    primitives.push({ attributes, indices, material: 0 });
  }

  glb.json.meshes ??= [];
  glb.json.meshes.push({ name: geometry.name, primitives });
}

function primitiveInputId(input: PrimitiveInput): string {
  return input.set == undefined || input.set === 0
    ? input.semantic
    : `${input.semantic}${input.set}`;
}

function findFloatSource(sourceRef: string, geometry: LibraryGeometry): FloatSource {
  let sourceId = sourceRef.slice(1);
  let floatSource = geometry.sources.get(sourceId);
  if (floatSource) {
    return floatSource;
  }

  const vertices = geometry.vertices.get(sourceId);
  if (!vertices) {
    const allKeys = [...geometry.sources.keys(), ...geometry.vertices.keys()];
    throw new Error(`Cannot find source '${sourceId}' in '${allKeys.join(", ")}'`);
  }

  if (vertices.inputs.size !== 1) {
    throw new Error(`vertices with ${vertices.inputs.size} inputs not supported`);
  }

  sourceId = vertices.inputs.values().next().value.slice(1);
  floatSource = geometry.sources.get(sourceId);
  if (floatSource) {
    return floatSource;
  }

  throw new Error(
    `Cannot find source '${sourceId}' in '${Array.from(geometry.sources.keys()).join(", ")}'`,
  );
}

function sourceToAccessorId(source: FloatSource, glb: GlbModel): number {
  glb.json.accessors ??= [];
  const index = glb.json.accessors.findIndex((accessor) => accessor.name === source.id);
  if (index >= 0) {
    return index;
  }

  const stride = source.stride ?? 1;
  glb.json.buffers ??= [];
  glb.json.bufferViews ??= [];

  const accessorId = glb.accessors.length;
  glb.accessors.push(source.array.data);

  glb.json.buffers.push({ byteLength: source.array.data.byteLength });
  glb.json.bufferViews.push({
    buffer: glb.json.buffers.length - 1,
    byteLength: source.array.data.byteLength,
  });
  glb.json.accessors.push({
    name: source.id,
    bufferView: glb.json.bufferViews.length - 1,
    componentType: FLOAT,
    count: source.array.data.length / stride,
    type: strideToType(stride),
  });

  return accessorId;
}

// TODO: Pass along additional context Map<string, number> that stores source -> accessor id
function indicesToAccessorId(indices: Uint16Array, glb: GlbModel): number {
  const [min, max] = minMax(indices);

  glb.json.buffers ??= [];
  glb.json.bufferViews ??= [];
  glb.json.accessors ??= [];

  const accessorId = glb.accessors.length;
  glb.accessors.push(indices);

  glb.json.buffers.push({ byteLength: indices.byteLength });
  glb.json.bufferViews.push({
    buffer: glb.json.buffers.length - 1,
    byteLength: indices.byteLength,
  });
  glb.json.accessors.push({
    name: `${accessorId}-indices`,
    bufferView: glb.json.bufferViews.length - 1,
    componentType: UNSIGNED_SHORT,
    count: indices.length,
    type: "SCALAR",
    min: [min],
    max: [max],
  });

  return accessorId;
}

function parseImages(collada: Element): LibraryImage[] {
  const library = getElementByTagName(collada, "library_images");
  if (!library) {
    return [];
  }

  const images: LibraryImage[] = [];
  for (const el of getElementsByTagName(library, "image")) {
    const id = getAttribute(el, "id");
    const initFrom = getElementByTagName(el, "init_from")?.textContent;
    if (id && initFrom) {
      images.push({ id, initFrom });
    }
  }
  return images;
}

function parseGeometries(collada: Element): LibraryGeometry[] {
  const library = getElementByTagName(collada, "library_geometries");
  if (!library) {
    return [];
  }

  const geometries: LibraryGeometry[] = [];
  for (const el of getElementsByTagName(library, "geometry")) {
    const id = getAttribute(el, "id");
    if (!id) {
      throw new Error(`geometry is missing id`);
    }
    const name = getAttribute(el, "name") ?? id;

    const mesh = getElementByTagName(el, "mesh");
    if (!mesh) {
      throw new Error(`only mesh geometry is supported`);
    }

    const sources = parseFloatSources(mesh);
    const vertices = parseGeometryVertices(mesh);
    const primitives = parsePrimitives(mesh);
    geometries.push({ id, name, sources, vertices, primitives });
  }
  return geometries;
}

function parseFloatSources(el: Element): Map<string, FloatSource> {
  const sources = new Map<string, FloatSource>();
  for (const sourceEl of getElementsByTagName(el, "source")) {
    const source = parseFloatSource(sourceEl);
    sources.set(source.id, source);
  }
  return sources;
}

function parseFloatSource(sourceEl: Element): FloatSource {
  const id = getAttribute(sourceEl, "id");
  if (!id) {
    throw new Error(`source is missing id`);
  }

  // Parse string float values into a Float32Array
  const arrayEl = getElementByTagName(sourceEl, "float_array");
  if (!arrayEl) {
    throw new Error(`source ${id} is missing float_array`);
  }
  const array = parseFloatArray(arrayEl);

  // Extract stride if available, otherwise default to 1
  let stride: number | undefined;
  const technique = getElementByTagName(sourceEl, "technique_common");
  if (technique) {
    const accessor = getElementByTagName(technique, "accessor");
    if (accessor) {
      stride = parseInt(getAttribute(accessor, "stride") ?? "1");
    }
  }

  return { id, array, stride };
}

function parseFloatArray(arrayEl: Element): FloatArray {
  const id = getAttribute(arrayEl, "id");
  if (!id) {
    throw new Error(`float_array is missing id`);
  }

  const text = arrayEl.textContent ?? "";
  const parts = text.trim().split(/\s+/);
  const array = new Array(parts.length);
  for (let i = 0; i < parts.length; i++) {
    array[i] = parseFloat(parts[i]!);
  }
  const data = new Float32Array(array);
  return { id, data };
}

function parseUint16Array(arrayEl: Element): Uint16Array {
  const text = arrayEl.textContent ?? "";
  const parts = text.trim().split(/\s+/);
  const array = new Array(parts.length);
  for (let i = 0, l = parts.length; i < l; i++) {
    array[i] = parseInt(parts[i]!);
  }
  return new Uint16Array(array);
}

function parseGeometryVertices(el: Element): Map<string, GeometryVertices> {
  const vertices = new Map<string, GeometryVertices>();
  for (const verticesEl of getElementsByTagName(el, "vertices")) {
    const entry = parseGeometryVerticesEntry(verticesEl);
    vertices.set(entry.id, entry);
  }
  return vertices;
}

function parseGeometryVerticesEntry(verticesEl: Element): GeometryVertices {
  const id = getAttribute(verticesEl, "id");
  if (!id) {
    throw new Error(`vertices is missing id`);
  }

  const inputs = new Map<string, string>(); // semantic -> source
  for (const input of getElementsByTagName(verticesEl, "input")) {
    const semantic = getAttribute(input, "semantic");
    const source = getAttribute(input, "source");
    if (semantic && source) {
      inputs.set(semantic, source);
    }
  }
  return { id, inputs };
}

function parsePrimitives(el: Element): GeometryPrimitive[] {
  const primitives: GeometryPrimitive[] = [];
  for (const primitiveEl of getElementsByTagName(el, "triangles")) {
    const primitive = parsePrimitive(primitiveEl);
    primitives.push(primitive);
  }
  return primitives;
}

function parsePrimitive(primitiveEl: Element): GeometryPrimitive {
  const type = primitiveEl.nodeName;
  if (type !== "triangles") {
    throw new Error(`unsupported primitive type ${type}`);
  }

  const material = getAttribute(primitiveEl, "material");
  if (!material) {
    throw new Error(`primitive is missing <material>`);
  }

  const count = parseInt(getAttribute(primitiveEl, "count") ?? "0");
  const inputs = parsePrimitiveInputs(primitiveEl);
  const stride = parseInt(getAttribute(primitiveEl, "stride") ?? "1");
  const hasUV =
    Array.from(inputs.values()).find((input) => input.semantic === "TEXCOORD") != undefined;

  const pEl = getElementByTagName(primitiveEl, "p");
  if (!pEl) {
    throw new Error(`primitive is missing <p>`);
  }
  const p = parseUint16Array(pEl);

  return { type, material, count, inputs, stride, hasUV, p };
}

function parsePrimitiveInputs(primitiveEl: Element): Map<string, PrimitiveInput> {
  const inputs = new Map<string, PrimitiveInput>();
  for (const inputEl of getElementsByTagName(primitiveEl, "input")) {
    const input = parsePrimitiveInput(inputEl);
    inputs.set(input.semantic, input);
  }
  return inputs;
}

function parsePrimitiveInput(inputEl: Element): PrimitiveInput {
  const semantic = getAttribute(inputEl, "semantic");
  const source = getAttribute(inputEl, "source");
  if (!semantic || !source) {
    throw new Error(`input is missing semantic or source`);
  }
  const offset = parseInt(getAttribute(inputEl, "offset") ?? "0");
  const set = inputEl.hasAttribute("set")
    ? parseInt(getAttribute(inputEl, "set") ?? "0")
    : undefined;
  return { semantic, source, offset, set };
}

function parseAsset(collada: Element): Asset {
  const assetXml = getElementByTagName(collada, "asset");
  if (!assetXml) {
    return { scale: 1, upAxis: "Y_UP" };
  }

  const unitXml = getElementByTagName(assetXml, "unit");
  const scale = parseFloat(unitXml?.getAttribute("meter") ?? "1");

  const upAxisXml = getElementByTagName(assetXml, "up_axis");
  const upAxis = (upAxisXml?.textContent ?? "Y_UP") as UpAxis;
  return { scale, upAxis };
}

// Non-recursive xml.getElementsByTagName()
function getElementsByTagName(xml: Element | Document, name: string): Element[] {
  return Array.from(xml.children).filter((el) => el.nodeName === name);
}

function getElementByTagName(xml: Element | Document, name: string): Element | undefined {
  const results = getElementsByTagName(xml, name);
  return results[0] ?? undefined;
}

function getAttribute(xml: Element, name: string): string | undefined {
  return xml.getAttribute(name) ?? undefined;
}

// convert the parser error element into text with each child elements text
// separated by new lines.
function parserErrorToText(parserError: Element): string {
  let result = "";
  const stack: (Element | ChildNode)[] = [parserError];

  while (stack.length > 0) {
    const node = stack.shift()!;
    if (node.nodeType === Node.TEXT_NODE) {
      result += node.textContent ?? "";
    } else {
      result += "\n";
      stack.push(...node.childNodes);
    }
  }

  return result.trim();
}

function strideToType(stride: number): string {
  switch (stride) {
    case 1:
    default:
      return "SCALAR";
    case 2:
      return "VEC2";
    case 3:
      return "VEC3";
    case 4:
      return "VEC4";
    case 9:
      return "MAT3";
    case 16:
      return "MAT4";
  }
}

function upAxisToRotation(upAxis: UpAxis): [number, number, number, number] {
  switch (upAxis) {
    case "X_UP":
      throw new Error(`X_UP orientation not supported`);
    case "Y_UP":
      return [0, 0, 0, 1]; // Identity
    case "Z_UP":
      return [-Math.SQRT1_2, 0, 0, Math.SQRT1_2]; // Z-up to Y-up
  }
}

function minMax<T extends Float32Array | Uint16Array>(array: T): [min: number, max: number] {
  let min = Infinity;
  let max = -Infinity;
  for (const value of array) {
    if (value < min) {
      min = value;
    }
    if (value > max) {
      max = value;
    }
  }
  return [min, max];
}
