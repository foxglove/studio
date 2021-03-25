// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { BlockId, FactoryId, ReturnMode } from "./VelodyneTypes";

// 24 bytes, uint16 distance + uint8 intensity
export type LaserReturn = [distance: number, intensity: number];

export class RawBlock {
  view: DataView;
  blockId: BlockId;
  rotation: number; // [0-35999], divide by 100 to get degrees

  constructor(public data: Uint8Array) {
    this.view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    this.blockId = this.view.getUint16(0, true);
    this.rotation = this.view.getUint16(2, true);
  }

  isUpperBlock(): boolean {
    return this.blockId === BlockId.Block_32_To_63;
  }

  laserReturn(index: number): LaserReturn {
    // assert(index < SCANS_PER_BLOCK);
    const offset = 4 + 3 * index;
    return [this.view.getUint16(offset, true), this.data[offset + 2] as number];
  }
}

export class RawPacket {
  static RAW_SCAN_SIZE = 3;
  static SCANS_PER_BLOCK = 32;
  static BLOCK_DATA_SIZE = RawPacket.SCANS_PER_BLOCK * RawPacket.RAW_SCAN_SIZE;
  static BLOCK_SIZE = RawPacket.BLOCK_DATA_SIZE + 4;
  static BLOCKS_PER_PACKET = 12;

  blocks: RawBlock[];
  gpsTimestamp: number; // microseconds since the top of the hour
  factoryField1: number; // raw representation of ReturnMode
  factoryField2: number; // raw representation of FactoryId
  returnMode?: ReturnMode;
  factoryId?: FactoryId;

  constructor(public data: Uint8Array) {
    this.blocks = [];
    for (let i = 0; i < RawPacket.BLOCKS_PER_PACKET; i++) {
      const blockSize = RawPacket.BLOCK_SIZE;
      const blockData = new Uint8Array(data.buffer, data.byteOffset + blockSize * i, blockSize);
      this.blocks.push(new RawBlock(blockData));
    }

    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

    this.gpsTimestamp = view.getUint32(1200, true);
    this.factoryField1 = data[1204] as number;
    this.factoryField2 = data[1205] as number;
    this.returnMode = this.factoryField1 in ReturnMode ? this.factoryField1 : undefined;
    this.factoryId = this.factoryField2 in FactoryId ? this.factoryField2 : undefined;
  }
}
