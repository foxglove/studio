// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as THREE from "three";

import { FontManager } from "./FontManager";

class LabelMaterial extends THREE.RawShaderMaterial {
  constructor(atlasTexture: THREE.Texture) {
    const picking = false; //FIXME
    super({
      vertexShader: `\
#version 300 es
precision highp float;
precision highp int;
uniform mat4 projectionMatrix, modelViewMatrix, modelMatrix;

uniform float uScale;
uniform vec2 uLabelSize;
uniform vec2 uTextureSize;
uniform vec2 uCenter;

in vec2 uv;
in vec2 position;
in vec2 instanceBoxPosition, instanceCharPosition;
in vec2 instanceUv;
in vec2 instanceBoxSize, instanceCharSize;
out mediump vec2 vUv;
out mediump vec2 vInsideChar;
out mediump vec2 vPosInLabel;
void main() {
  // Adjust uv coordinates so they are in the 0-1 range in the character region
  vec2 boxUv = (uv * instanceBoxSize - (instanceCharPosition - instanceBoxPosition)) / instanceCharSize;
  // vUv = (instanceUv + uv * instanceBoxSize) / uTextureSize;
  vInsideChar = boxUv;
  vUv = (instanceUv + boxUv * instanceCharSize) / uTextureSize;
  vec2 vertexPos = (instanceBoxPosition + position * instanceBoxSize) * uScale;
  vPosInLabel = (instanceBoxPosition + position * instanceBoxSize);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(vertexPos, 0.0, 1.0);

  return;

  // Adapted from THREE.ShaderLib.sprite

  float rotation = 0.0;

  vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
  vec2 scale;
  scale.x = length(modelMatrix[0].xyz);
  scale.y = length(modelMatrix[1].xyz);
  // #ifndef USE_SIZEATTENUATION
  //   bool isPerspective = isPerspectiveMatrix( projectionMatrix );
  //   if ( isPerspective ) scale *= - mvPosition.z;
  // #endif
  vec2 alignedPosition = ( position.xy - ( uCenter - vec2( 0.5 ) ) ) * scale;
  vec2 rotatedPosition;
  rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
  rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
  mvPosition.xy += rotatedPosition;
  gl_Position = projectionMatrix * mvPosition;
}
`,
      fragmentShader: `\
#version 300 es
#ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
#else
  precision mediump float;
#endif
uniform sampler2D uMap;
uniform float uOpacity;
${picking ? "uniform vec4 objectId;" : ""}
uniform mediump vec3 uColor, uBackgroundColor;
uniform float uScale;
uniform vec2 uLabelSize;
in mediump vec2 vUv;
in mediump vec2 vPosInLabel;
in mediump vec2 vInsideChar;
out vec4 outColor;

${THREE.ShaderChunk.encodings_pars_fragment /* for LinearTosRGB() */}

// From https://github.com/Jam3/three-bmfont-text/blob/e17efbe4e9392a83d4c5ee35c67eca5a11a13395/shaders/sdf.js
float aastep(float threshold, float value) {
  float afwidth = length(vec2(dFdx(value), dFdy(value))) * 0.70710678118654757;
  return smoothstep(threshold - afwidth, threshold + afwidth, value);
}

void main() {
  float dist = texture(uMap, vUv).a;
  vec4 color = vec4(uBackgroundColor.rgb * (1.0 - dist) + uColor * dist, uOpacity);
  // outColor = LinearTosRGB(color);

  outColor = vec4(mix(uBackgroundColor, uColor, aastep(0.75, dist)), uOpacity);

  bool insideChar = vInsideChar.x >= 0.0 && vInsideChar.x <= 1.0 && vInsideChar.y >= 0.0 && vInsideChar.y <= 1.0;
  outColor = insideChar ? outColor : vec4(uBackgroundColor, uOpacity);
  outColor = LinearTosRGB(outColor);

  // outColor = insideChar ? vec4(0.,1.,0.,1.) : vec4(1.0,0.0,0.0, 1.0);

  ${picking ? "outColor = objectId;" : ""}
}
`,
      uniforms: {
        uCenter: { value: [0, 0] },
        uLabelSize: { value: [0, 0] },
        uScale: { value: 0 },
        uTextureSize: { value: [atlasTexture.image.width, atlasTexture.image.height] },
        uMap: { value: atlasTexture },
        uOpacity: { value: 1 },
        uColor: { value: [1, 0, 0.5] },
        uBackgroundColor: { value: [0.6, 0.6, 1] },
      },

      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
    });
  }
}

export class Label extends THREE.Object3D {
  text = "";
  mesh: THREE.InstancedMesh;
  geometry: THREE.InstancedBufferGeometry;
  material: LabelMaterial;

  instanceAttributeData: Float32Array;
  instanceAttributeBuffer: THREE.InstancedInterleavedBuffer;

  constructor(public labelPool: LabelPool) {
    super();

    this.geometry = new THREE.InstancedBufferGeometry();

    //FIXME: share these with all labels in LabelPool?
    const positions: [number, number][] = [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ];
    this.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(positions.flat()), 2),
    );
    this.geometry.setAttribute(
      "uv",
      new THREE.BufferAttribute(new Float32Array(positions.map(([x, y]) => [x, 1 - y]).flat()), 2),
    );

    this.instanceAttributeData = new Float32Array();
    this.instanceAttributeBuffer = new THREE.InstancedInterleavedBuffer(
      this.instanceAttributeData,
      10,
      1,
    );
    this.geometry.setAttribute(
      "instanceBoxPosition",
      new THREE.InterleavedBufferAttribute(this.instanceAttributeBuffer, 2, 0),
    );
    this.geometry.setAttribute(
      "instanceCharPosition",
      new THREE.InterleavedBufferAttribute(this.instanceAttributeBuffer, 2, 2),
    );
    this.geometry.setAttribute(
      "instanceUv",
      new THREE.InterleavedBufferAttribute(this.instanceAttributeBuffer, 2, 4),
    );
    this.geometry.setAttribute(
      "instanceBoxSize",
      new THREE.InterleavedBufferAttribute(this.instanceAttributeBuffer, 2, 6),
    );
    this.geometry.setAttribute(
      "instanceCharSize",
      new THREE.InterleavedBufferAttribute(this.instanceAttributeBuffer, 2, 8),
    );

    this.material = new LabelMaterial(labelPool.atlasTexture);

    //FIXME: don't need InstancedMesh?
    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, 0);

    this.add(this.mesh);
  }

  update(text?: string): void {
    if (text != undefined) {
      this.text = text;
      this.labelPool.update(text);
      this.material.uniforms.uTextureSize!.value[0] = this.labelPool.atlasTexture.image.width;
      this.material.uniforms.uTextureSize!.value[1] = this.labelPool.atlasTexture.image.height;
      this.material.uniforms.uScale!.value = 1 / this.labelPool.fontManager.atlasData.lineHeight;
    }

    const layoutInfo = this.labelPool.fontManager.layout(this.text);
    //FIXME: bad to use uniforms because we can't use the same material?
    this.material.uniforms.uLabelSize!.value[0] = layoutInfo.width;
    this.material.uniforms.uLabelSize!.value[1] = layoutInfo.height;

    this.geometry.instanceCount = this.mesh.count = layoutInfo.chars.length;

    const requiredLength = layoutInfo.chars.length * 10 * Float32Array.BYTES_PER_ELEMENT;
    if (this.instanceAttributeData.byteLength < requiredLength) {
      this.instanceAttributeBuffer.array = this.instanceAttributeData = new Float32Array(
        requiredLength,
      );
    }
    let i = 0;
    for (const char of layoutInfo.chars) {
      // instanceBoxPosition
      this.instanceAttributeData[i++] = char.left;
      this.instanceAttributeData[i++] = layoutInfo.height - char.boxTop - char.boxHeight;
      // instanceCharPosition
      this.instanceAttributeData[i++] = char.left;
      this.instanceAttributeData[i++] =
        layoutInfo.height - char.boxTop - char.boxHeight + char.top - char.boxTop;
      // instanceUv
      this.instanceAttributeData[i++] = char.atlasX;
      this.instanceAttributeData[i++] = char.atlasY;
      // instanceBoxSize
      this.instanceAttributeData[i++] = char.width;
      this.instanceAttributeData[i++] = char.boxHeight;
      // instanceCharSize
      this.instanceAttributeData[i++] = char.width;
      this.instanceAttributeData[i++] = char.height;
    }
    this.instanceAttributeBuffer.needsUpdate = true;
  }
}

export class LabelPool {
  atlasTexture: THREE.DataTexture;
  constructor(public fontManager: FontManager) {
    this.atlasTexture = new THREE.DataTexture(
      new Uint8ClampedArray(),
      0,
      0,
      THREE.RGBAFormat,
      THREE.UnsignedByteType,
      THREE.UVMapping,
      THREE.ClampToEdgeWrapping,
      THREE.ClampToEdgeWrapping,
      THREE.LinearFilter,
      THREE.LinearFilter,
    );
  }

  update(text: string): void {
    this.fontManager.update(text);

    //FIXME: THREE.AlphaFormat not working? :(
    const data = new Uint8ClampedArray(this.fontManager.atlasData.data.length * 4);
    for (let i = 0; i < this.fontManager.atlasData.data.length; i++) {
      data[i * 4 + 0] = data[i * 4 + 1] = data[i * 4 + 2] = 1;
      data[i * 4 + 3] = this.fontManager.atlasData.data[i]!;
    }

    this.atlasTexture.image = {
      data,
      width: this.fontManager.atlasData.width,
      height: this.fontManager.atlasData.height,
    };
    this.atlasTexture.needsUpdate = true;
  }

  acquire(): Label {
    //FIXME
    return new Label(this);
  }
}
