export type CdrWriterOpts = {
  buffer?: ArrayBuffer;
  size?: number;
  bigEndian?: boolean;
};

export class CdrWriter {
  static DEFAULT_CAPACITY = 16;

  private littleEndian: boolean;
  private buffer: ArrayBuffer;
  private array: Uint8Array;
  private view: DataView;
  private textEncoder = new TextEncoder();
  private offset: number;

  get data(): Uint8Array {
    return new Uint8Array(this.buffer, 0, this.offset);
  }

  get size(): number {
    return this.offset;
  }

  constructor(options: CdrWriterOpts = {}) {
    if (options.buffer != undefined) {
      this.buffer = options.buffer;
    } else if (options.size != undefined) {
      this.buffer = new ArrayBuffer(options.size);
    } else {
      this.buffer = new ArrayBuffer(CdrWriter.DEFAULT_CAPACITY);
    }

    this.littleEndian = !(options.bigEndian === true);
    this.array = new Uint8Array(this.buffer);
    this.view = new DataView(this.buffer);

    // Write the Representation Id and Offset fields
    this.resizeIfNeeded(4);
    // {0x00, 0x00} -- PLAIN_CDR, BIG_ENDIAN,
    // {0x00, 0x01} -- PLAIN_CDR, LITTLE_ENDIAN
    this.view.setUint16(0, this.littleEndian ? 1 : 0, false);
    // The RTPS specification does not define any settings for the 2 byte
    // options field and further states that a receiver should not interpret it
    // when it reads the options field
    this.view.setUint16(2, 0, false);
    this.offset = 4;
  }

  int8(value: number): CdrWriter {
    this.resizeIfNeeded(1);
    this.view.setInt8(this.offset, value);
    this.offset += 1;
    return this;
  }

  uint8(value: number): CdrWriter {
    this.resizeIfNeeded(1);
    this.view.setUint8(this.offset, value);
    this.offset += 1;
    return this;
  }

  int16(value: number): CdrWriter {
    this.align(2);
    this.view.setInt16(this.offset, value, this.littleEndian);
    this.offset += 2;
    return this;
  }

  uint16(value: number): CdrWriter {
    this.align(2);
    this.view.setUint16(this.offset, value, this.littleEndian);
    this.offset += 2;
    return this;
  }

  int32(value: number): CdrWriter {
    this.align(4);
    this.view.setInt32(this.offset, value, this.littleEndian);
    this.offset += 4;
    return this;
  }

  uint32(value: number): CdrWriter {
    this.align(4);
    this.view.setUint32(this.offset, value, this.littleEndian);
    this.offset += 4;
    return this;
  }

  int64(value: bigint): CdrWriter {
    this.align(8);
    this.view.setBigInt64(this.offset, value, this.littleEndian);
    this.offset += 8;
    return this;
  }

  uint64(value: bigint): CdrWriter {
    this.align(8);
    this.view.setBigUint64(this.offset, value, this.littleEndian);
    this.offset += 8;
    return this;
  }

  float32(value: number): CdrWriter {
    this.align(4);
    this.view.setFloat32(this.offset, value, this.littleEndian);
    this.offset += 4;
    return this;
  }

  float64(value: number): CdrWriter {
    this.align(8);
    this.view.setFloat64(this.offset, value, this.littleEndian);
    this.offset += 8;
    return this;
  }

  string(value: string): CdrWriter {
    const strlen = value.length;
    this.uint32(strlen + 1); // Add one for the null terminator
    this.resizeIfNeeded(strlen + 1);
    this.textEncoder.encodeInto(value, new Uint8Array(this.buffer, this.offset, strlen));
    this.view.setUint8(this.offset + strlen, 0);
    this.offset += strlen + 1;
    return this;
  }

  sequenceLength(value: number): CdrWriter {
    return this.uint32(value);
  }

  // Calculate the capacity needed to hold the given number of aligned bytes,
  // resize if needed, and write padding bytes for alignment
  private align(size: number): void {
    // The four byte header is not considered for alignment
    const alignment = (this.offset - 4) % size;
    const padding = alignment > 0 ? size - alignment : 0;
    this.resizeIfNeeded(padding + size);
    // Write padding bytes
    this.array.fill(0, this.offset, this.offset + padding);
    this.offset += padding;
  }

  private resizeIfNeeded(additionalBytes: number): void {
    const capacity = this.offset + additionalBytes;
    if (this.buffer.byteLength < capacity) {
      const doubled = this.buffer.byteLength * 2;
      const newCapacity = doubled > capacity ? doubled : capacity;
      this.resize(newCapacity);
    }
  }

  private resize(capacity: number): void {
    if (this.buffer.byteLength >= capacity) {
      return;
    }

    const buffer = new ArrayBuffer(capacity);
    const array = new Uint8Array(buffer);
    array.set(this.array);
    this.buffer = buffer;
    this.array = array;
    this.view = new DataView(buffer);
  }
}
