// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

export default class Reader {
  offset = 0;
  buffer: ArrayBuffer;

  private view: DataView;
  private textDecoder = new TextDecoder();

  constructor(buffer: ArrayBuffer) {
    this.buffer = buffer;
    this.view = new DataView(buffer);
  }
  int8(): number {
    const val = this.view.getInt8(this.offset);
    this.offset += 1;
    return val;
  }
  uint8(): number {
    const val = this.view.getUint8(this.offset);
    this.offset += 1;
    return val;
  }
  int16(): number {
    const val = this.view.getInt16(this.offset);
    this.offset += 2;
    return val;
  }
  uint16(): number {
    const val = this.view.getUint16(this.offset);
    this.offset += 2;
    return val;
  }
  int32(): number {
    const val = this.view.getInt32(this.offset);
    this.offset += 4;
    return val;
  }
  uint32(): number {
    const val = this.view.getUint32(this.offset);
    this.offset += 4;
    return val;
  }
  int64(): bigint {
    const val = this.view.getBigInt64(this.offset);
    this.offset += 8;
    return val;
  }
  uint64(): bigint {
    const val = this.view.getBigUint64(this.offset);
    this.offset += 8;
    return val;
  }
  string(): string {
    const length = this.uint32();
    const str = this.textDecoder.decode(new DataView(this.view.buffer, this.offset, length));
    this.offset += length;
    return str;
  }
  array<T>(read: (reader: Reader) => T): T[] {
    const length = this.uint32();
    const arr = new Array(length);
    for (let i = 0; i < length; i++) {
      arr[i] = read(this);
    }
    return arr;
  }
}
