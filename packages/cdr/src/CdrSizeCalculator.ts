export class CdrSizeCalculator {
  // Two bytes for Representation Id and two bytes for Options
  private offset = 4;

  get size() {
    return this.offset;
  }

  int8(): number {
    return this.incrementAndReturn(1);
  }

  uint8(): number {
    return this.incrementAndReturn(1);
  }

  int16(): number {
    return this.incrementAndReturn(2);
  }

  uint16(): number {
    return this.incrementAndReturn(2);
  }

  int32(): number {
    return this.incrementAndReturn(4);
  }

  uint32(): number {
    return this.incrementAndReturn(4);
  }

  int64(): number {
    return this.incrementAndReturn(8);
  }

  uint64(): number {
    return this.incrementAndReturn(8);
  }

  float32(): number {
    return this.incrementAndReturn(4);
  }

  float64(): number {
    return this.incrementAndReturn(4);
  }

  string(length: number): number {
    this.uint32();
    this.offset += length + 1; // Add one for the null terminator
    return this.offset;
  }

  sequenceLength(): number {
    return this.uint32();
  }

  // Increments the offset by `byteCount` and any required padding bytes and
  // returns the new offset
  private incrementAndReturn(byteCount: number): number {
    const alignment = (this.offset - 4) % byteCount;
    this.offset += byteCount + alignment;
    return this.offset;
  }
}
