// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

export default class Writer {
  buffer: ArrayBuffer;
  view: DataView;
  offset = 0;
  textEncoder = new TextEncoder();
  constructor(scratchBuffer: ArrayBuffer) {
    this.buffer = scratchBuffer ?? new ArrayBuffer(4096);
    this.view = new DataView(this.buffer);
  }
  ensureCapacity(capacity: number): void {
    if (this.offset + capacity >= this.buffer.byteLength) {
      const newBuffer = new ArrayBuffer(this.buffer.byteLength * 2);
      new Uint8Array(newBuffer).set(new Uint8Array(this.buffer));
      this.buffer = newBuffer;
      this.view = new DataView(newBuffer);
    }
  }
  int8(value: number): void {
    this.ensureCapacity(1);
    this.view.setInt8(this.offset, value);
    this.offset += 1;
  }
  uint8(value: number): void {
    this.ensureCapacity(1);
    this.view.setUint8(this.offset, value);
    this.offset += 1;
  }
  int16(value: number): void {
    this.ensureCapacity(2);
    this.view.setInt16(this.offset, value);
    this.offset += 2;
  }
  uint16(value: number): void {
    this.ensureCapacity(2);
    this.view.setUint16(this.offset, value);
    this.offset += 2;
  }
  int32(value: number): void {
    this.ensureCapacity(4);
    this.view.setInt32(this.offset, value);
    this.offset += 4;
  }
  uint32(value: number): void {
    this.ensureCapacity(4);
    this.view.setUint32(this.offset, value);
    this.offset += 4;
  }
  int64(value: bigint): void {
    this.ensureCapacity(8);
    this.view.setBigInt64(this.offset, value);
    this.offset += 8;
  }
  uint64(value: bigint): void {
    this.ensureCapacity(8);
    this.view.setBigUint64(this.offset, value);
    this.offset += 8;
  }
  string(value: string): void {
    this.uint32(value.length);
    const stringBytes = this.textEncoder.encode(value);
    this.ensureCapacity(stringBytes.byteLength);
    new Uint8Array(this.buffer, this.offset, stringBytes.byteLength).set(stringBytes);
  }
  array<T>(values: readonly T[], write: (value: T, writer: Writer) => void): void {
    this.uint32(values.length);
    for (const value of values) {
      write(value, this);
    }
  }
}
