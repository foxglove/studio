// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { GlbModel } from "@foxglove/studio-base/panels/ThreeDimensionalViz/utils/GlbModel";
import type { GlTf } from "@foxglove/studio-base/panels/ThreeDimensionalViz/utils/gltf";

type StlData = { position: Float32Array; normal: Float32Array };

export function parseStlToGlb(buffer: ArrayBuffer): GlbModel | undefined {
  const stlData = parse(buffer);
  if (!stlData) {
    return undefined;
  }

  const count = Math.floor(stlData.position.length / 3);
  const json: GlTf = {
    accessors: [
      {
        bufferView: 0,
        componentType: 5126, // FLOAT
        count,
        type: "VEC3",
      },
      {
        bufferView: 1,
        componentType: 5126, // FLOAT
        count,
        type: "VEC3",
      },
    ],
    asset: { generator: "Foxglove Studio STL parser", version: "2.0" },
    bufferViews: [
      { buffer: 0, byteLength: stlData.position.byteLength },
      { buffer: 1, byteLength: stlData.normal.byteLength },
    ],
    buffers: [
      { byteLength: stlData.position.byteLength },
      { byteLength: stlData.normal.byteLength },
    ],
    images: [],
    materials: [
      {
        pbrMetallicRoughness: {
          baseColorFactor: [0.5, 0.5, 0.5, 1],
          metallicFactor: 0,
          roughnessFactor: 1,
        },
      },
    ],
    meshes: [
      {
        primitives: [
          {
            attributes: { POSITION: 0, NORMAL: 1 },
            material: 0,
          },
        ],
      },
    ],
    nodes: [
      {
        mesh: 0,
        rotation: [0, 0, 0, 1],
      },
    ],
    scene: 0,
    scenes: [
      {
        nodes: [0],
      },
    ],
    textures: [],
  };

  return {
    json,
    accessors: [stlData.position, stlData.normal],
    images: [],
  };
}

function parse(data: ArrayBuffer): StlData | undefined {
  return isBinary(data) ? parseBinary(data) : parseAscii(new TextDecoder().decode(data));
}

function isBinary(data: ArrayBuffer) {
  const reader = new DataView(data);
  const face_size = (32 / 8) * 3 + (32 / 8) * 3 * 3 + 16 / 8;
  const n_faces = reader.getUint32(80, true);
  const expect = 80 + 32 / 8 + n_faces * face_size;

  if (expect === reader.byteLength) {
    return true;
  }

  // An ASCII STL data must begin with 'solid ' as the first six bytes.
  // However, ASCII STLs lacking the SPACE after the 'd' are known to be
  // plentiful.  So, check the first 5 bytes for 'solid'.

  // US-ASCII ordinal values for 's', 'o', 'l', 'i', 'd'
  const solid = [115, 111, 108, 105, 100];

  for (let i = 0; i < 5; i++) {
    // If solid[i] does not match the i-th byte, then it is not an
    // ASCII STL; hence, it is binary and return true
    if (solid[i] !== reader.getUint8(i)) {
      return true;
    }
  }

  // First 5 bytes read "solid"; declare it to be an ASCII STL
  return false;
}

function parseBinary(data: ArrayBuffer): StlData | undefined {
  const reader = new DataView(data);
  const faces = reader.getUint32(80, true);

  const dataOffset = 84;
  const faceLength = 12 * 4 + 2;

  const stlData: StlData = {
    position: new Float32Array(faces * 3 * 3),
    normal: new Float32Array(faces * 3 * 3),
  };

  for (let face = 0; face < faces; face++) {
    const start = dataOffset + face * faceLength;
    const normalX = reader.getFloat32(start, true);
    const normalY = reader.getFloat32(start + 4, true);
    const normalZ = reader.getFloat32(start + 8, true);

    for (let i = 0; i < 2; i++) {
      const vertexStart = start + i * 12;
      const vertexX = reader.getFloat32(vertexStart, true);
      const vertexY = reader.getFloat32(vertexStart + 4, true);
      const vertexZ = reader.getFloat32(vertexStart + 8, true);

      const positionStart = face * 9 + i * 3;
      stlData.position[positionStart] = vertexX;
      stlData.position[positionStart + 1] = vertexY;
      stlData.position[positionStart + 2] = vertexZ;
      stlData.normal[positionStart] = normalX;
      stlData.normal[positionStart + 1] = normalY;
      stlData.normal[positionStart + 2] = normalZ;
    }
  }

  return stlData;
}

function parseAscii(data: string): StlData | undefined {
  const FACE_REGEX = /facet([\s\S]*?)endfacet/g;
  const NORMAL_REGEX =
    /normal[\s]+([-+]?[0-9]+\.?[0-9]*([eE][-+]?[0-9]+)?)+[\s]+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)+[\s]+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)+/g;
  const VERTEX_REGEX =
    /vertex[\s]+([-+]?[0-9]+\.?[0-9]*([eE][-+]?[0-9]+)?)+[\s]+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)+[\s]+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)+/g;

  const vertices: number[] = [];
  const normals: number[] = [];

  const normal = { x: 0, y: 0, z: 0 };

  let result: ReturnType<typeof FACE_REGEX.exec>;
  while ((result = FACE_REGEX.exec(data))) {
    const text = result[0]!;

    while ((result = NORMAL_REGEX.exec(text))) {
      normal.x = parseFloat(result[1]!);
      normal.y = parseFloat(result[3]!);
      normal.z = parseFloat(result[5]!);
    }

    while ((result = VERTEX_REGEX.exec(text))) {
      vertices.push(parseFloat(result[1]!), parseFloat(result[3]!), parseFloat(result[5]!));
      normals.push(normal.x, normal.y, normal.z);
    }
  }

  return {
    position: new Float32Array(vertices),
    normal: new Float32Array(normals),
  };
}
