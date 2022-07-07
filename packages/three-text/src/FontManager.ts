// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import TinySDF from "@mapbox/tiny-sdf";

export type CharInfo = {
  atlasX: number;
  atlasY: number;
  width: number;
  height: number;
  yOffset: number;
  xAdvance: number;
};
export type AtlasData = {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  charInfo: Record<string, CharInfo>;
  maxAscent: number;
  lineHeight: number;
};
export type CharLayoutInfo = {
  left: number;
  top: number;
  width: number;
  height: number;
  xAdvance: number;
  boxTop: number;
  boxHeight: number;
  atlasX: number;
  atlasY: number;
};
export type LayoutInfo = {
  width: number;
  height: number;
  chars: CharLayoutInfo[];
};

const REPLACEMENT_CHARACTER = "\uFFFD";

export type FontManagerOptions = {
  fontFamily?: string;
  fontSize?: number;
};

/**
 * Manages the creation of a Signed Distance Field (SDF) font atlas, and performs text layout to
 * generate attributes for rendering text using the atlas.
 */
export class FontManager {
  private alphabet = "";
  atlasData: AtlasData = {
    data: new Uint8ClampedArray(),
    width: 0,
    height: 0,
    lineHeight: 0,
    maxAscent: 0,
    charInfo: {},
  };

  constructor(public options: FontManagerOptions = {}) {
    const start = " ".charCodeAt(0);
    const end = "~".charCodeAt(0);
    let initialAlphabet = REPLACEMENT_CHARACTER + "\n"; // always include replacement character
    for (let i = start; i <= end; i++) {
      initialAlphabet += String.fromCodePoint(i);
    }
    this.update(initialAlphabet);
  }

  update(newChars: string): boolean {
    let needsUpdate = false;
    for (const char of newChars) {
      if (!this.alphabet.includes(char)) {
        this.alphabet += char;
        needsUpdate = true;
      }
    }

    if (!needsUpdate) {
      return false;
    }
    const atlasWidth = 1024;
    const atlasHeight = 1024;
    const atlas = new Uint8ClampedArray(atlasWidth * atlasHeight);
    const tinysdf = new TinySDF({
      fontSize: this.options.fontSize ?? 48,
      fontFamily: this.options.fontFamily ?? "monospace",
    });

    const charInfo: Record<string, CharInfo> = {};
    let x = 0;
    let y = 0;
    let rowHeight = 0;
    let lineHeight = 0;
    let maxAscent = 0;
    for (const char of this.alphabet) {
      if (charInfo[char] != undefined) {
        throw new Error(`Duplicate character in alphabet: ${char} (${char.codePointAt(0)})`);
      }
      const sdf = tinysdf.draw(char);
      if (x + sdf.width >= atlasWidth) {
        x = 0;
        y += rowHeight;
        rowHeight = 0;
      }
      if (y + sdf.height >= atlasHeight) {
        throw new Error(`Unable to fit all ${this.alphabet.length} characters in font atlas`);
      }
      rowHeight = Math.max(rowHeight, sdf.height);
      lineHeight = Math.max(lineHeight, rowHeight);
      for (let r = 0; r < sdf.height; r++) {
        atlas.set(sdf.data.subarray(sdf.width * r, sdf.width * (r + 1)), atlasWidth * (y + r) + x);
      }
      charInfo[char] = {
        atlasX: x,
        atlasY: y,
        width: sdf.width,
        height: sdf.height,
        yOffset: sdf.glyphTop,
        // xAdvance: sdf.glyphAdvance, //FIXME: overlaps = sadness
        // xAdvance: sdf.width,
        xAdvance: Math.max(sdf.glyphAdvance as number, sdf.width),
      };
      maxAscent = Math.max(maxAscent, sdf.glyphTop);
      x += sdf.width;
    }

    this.atlasData = {
      data: atlas,
      width: atlasWidth,
      height: atlasHeight,
      charInfo,
      maxAscent,
      lineHeight,
    };
    return true;
  }

  layout(text: string): LayoutInfo {
    const chars: CharLayoutInfo[] = [];
    let x = 0;
    let lineTop = 0;
    let width = 0;
    let height = 0;
    for (const char of text) {
      if (char === "\n") {
        lineTop += this.atlasData.lineHeight;
        x = 0;
      } else {
        const info =
          this.atlasData.charInfo[char] ?? this.atlasData.charInfo[REPLACEMENT_CHARACTER]!;
        chars.push({
          left: x,
          top: lineTop - info.yOffset + this.atlasData.maxAscent,
          boxTop: lineTop,
          boxHeight: this.atlasData.lineHeight,
          width: info.width,
          height: info.height,
          xAdvance: info.xAdvance,
          atlasX: info.atlasX,
          atlasY: info.atlasY,
        });
        x += info.xAdvance;
        width = Math.max(width, x);
        height = Math.max(height, lineTop + this.atlasData.lineHeight);
      }
    }
    return { chars, width, height };
  }
}
