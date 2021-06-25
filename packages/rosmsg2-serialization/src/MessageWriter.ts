// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
// This file incorporates work covered by the following copyright and
// permission notice:
//
//   Copyright 2018-2021 Cruise LLC
//
//   This source code is licensed under the Apache License, Version 2.0,
//   found at http://www.apache.org/licenses/LICENSE-2.0
//   You may not use this file except in compliance with the License.

import { RosMsgDefinition, RosMsgField } from "@foxglove/rosmsg";
import { CdrSizeCalculator, CdrWriter } from "@foxglove/cdr";

export interface Time {
  // whole seconds
  sec: number;
  // additional nanoseconds past the sec value
  nsec: number;
}

type NamedRosMsgDefinition = {
  name: string;
  definitions: RosMsgField[];
};

class StandardTypeOffsetCalculator {
  calc = new CdrSizeCalculator();

  _incrementAndReturn = (increment: () => void) => {
    const size = this.calc.size;
    increment();
    return size;
  };

  string(value: string): number {
    return this._incrementAndReturn(() => this.calc.string(value.length));
  }

  bool(): number {
    return this._incrementAndReturn(() => this.calc.uint8());
  }

  int8(): number {
    return this._incrementAndReturn(() => this.calc.int8());
  }

  uint8(): number {
    return this._incrementAndReturn(() => this.calc.uint8());
  }

  int16(): number {
    return this._incrementAndReturn(() => this.calc.int16());
  }

  uint16(): number {
    return this._incrementAndReturn(() => this.calc.uint16());
  }

  int32(): number {
    return this._incrementAndReturn(() => this.calc.int32());
  }

  uint32(): number {
    return this._incrementAndReturn(() => this.calc.uint32());
  }

  float32(): number {
    return this._incrementAndReturn(() => this.calc.float32());
  }

  float64(): number {
    return this._incrementAndReturn(() => this.calc.float64());
  }

  int64(): number {
    return this._incrementAndReturn(() => this.calc.int64());
  }

  uint64(): number {
    return this._incrementAndReturn(() => this.calc.uint64());
  }

  time(): number {
    return this._incrementAndReturn(() => {
      this.calc.uint32();
      this.calc.uint32();
    });
  }

  duration(): number {
    return this.time();
  }
}

class StandardTypeWriter {
  writer: CdrWriter;
  offsetCalculator: StandardTypeOffsetCalculator;

  constructor(data: Uint8Array) {
    if (data.byteOffset !== 0) {
      throw new Error(`CDR serialization to non-zero buffer offsets is not supported`);
    }
    this.writer = new CdrWriter({ buffer: data.buffer });
    this.offsetCalculator = new StandardTypeOffsetCalculator();
  }

  string(value: string): void {
    this.writer.string(value);
  }

  bool(value: boolean): void {
    this.writer.uint8(value ? 1 : 0);
  }

  int8(value: number): void {
    this.writer.int8(value);
  }

  uint8(value: number): void {
    this.writer.uint8(value);
  }

  int16(value: number): void {
    this.writer.int16(value);
  }

  uint16(value: number): void {
    this.writer.uint16(value);
  }

  int32(value: number): void {
    this.writer.int32(value);
  }

  uint32(value: number): void {
    this.writer.uint32(value);
  }

  float32(value: number): void {
    this.writer.float32(value);
  }

  float64(value: number): void {
    this.writer.float64(value);
  }

  int64(value: bigint | number): void {
    if (typeof value !== "bigint") {
      value = BigInt(value);
    }
    this.writer.int64(value);
  }

  uint64(value: bigint | number): void {
    if (typeof value !== "bigint") {
      value = BigInt(value);
    }
    this.writer.uint64(value);
  }

  time(time: Time): void {
    this.writer.uint32(time.sec);
    this.writer.uint32(time.nsec);
  }

  duration(time: Time): void {
    this.writer.uint32(time.sec);
    this.writer.uint32(time.nsec);
  }
}

const findTypeByName = (types: RosMsgDefinition[], name = ""): NamedRosMsgDefinition => {
  let foundName = ""; // track name separately in a non-null variable to appease Flow
  const matches = types.filter((type) => {
    const typeName = type.name ?? "";
    // if the search is empty, return unnamed types
    if (name.length === 0) {
      return typeName.length === 0;
    }
    // return if the search is in the type name
    // or matches exactly if a fully-qualified name match is passed to us
    const nameEnd = name.includes("/") ? name : `/${name}`;
    if (typeName.endsWith(nameEnd)) {
      foundName = typeName;
      return true;
    }
    return false;
  });
  if (matches.length !== 1) {
    throw new Error(
      `Expected 1 top level type definition for '${name}' but found ${matches.length}.`,
    );
  }
  return { ...matches[0]!, name: foundName };
};

const friendlyName = (name: string): string => name.replace(/\//g, "_");
type WriterAndSizeCalculator = {
  writer: (message: unknown, output: Uint8Array) => Uint8Array;
  byteSizeCalculator: (message: unknown) => number;
};

function createWriterAndSizeCalculator(types: RosMsgDefinition[]): WriterAndSizeCalculator {
  const unnamedTypes = types.filter((type) => type.name == undefined);
  if (unnamedTypes.length !== 1) {
    throw new Error("multiple unnamed types");
  }

  const unnamedType = unnamedTypes[0]!;

  const namedTypes: NamedRosMsgDefinition[] = types.filter(
    (type) => type.name != undefined,
  ) as NamedRosMsgDefinition[];

  const constructorBody = (
    type: RosMsgDefinition | NamedRosMsgDefinition,
    argName: "offsetCalculator" | "writer",
  ): string | undefined => {
    const lines: string[] = [];
    type.definitions.forEach((def) => {
      if (def.isConstant === true) {
        return;
      }

      // Accesses the field we are currently writing. Pulled out for easy reuse.
      // FIXME: Handle def.defaultValue
      const accessMessageField = `message["${def.name}"]`;
      if (def.isArray === true) {
        const lenField = `length_${def.name}`;
        // set a variable pointing to the parsed fixed array length
        // or write the byte indicating the dynamic length
        // FIXME: Handle def.arrayUpperBound
        if (def.arrayLength != undefined) {
          lines.push(`var ${lenField} = ${def.arrayLength};`);
        } else {
          lines.push(`var ${lenField} = ${accessMessageField}.length;`);
          lines.push(`${argName}.uint32(${lenField});`);
        }

        // start the for-loop
        lines.push(`for (var i = 0; i < ${lenField}; i++) {`);
        // if the sub type is complex we need to allocate it and parse its values
        if (def.isComplex === true) {
          const defType = findTypeByName(types, def.type);
          // recursively call the function for the sub-type
          lines.push(`  ${friendlyName(defType.name)}(${argName}, ${accessMessageField}[i]);`);
        } else {
          // FIXME: Handle def.upperBound for strings
          // if the subtype is not complex its a simple low-level operation
          lines.push(`  ${argName}.${def.type}(${accessMessageField}[i]);`);
        }
        lines.push("}"); // close the for-loop
      } else if (def.isComplex === true) {
        const defType = findTypeByName(types, def.type);
        lines.push(`${friendlyName(defType.name)}(${argName}, ${accessMessageField});`);
      } else {
        // FIXME: Handle def.upperBound for strings
        // Call primitives directly.
        lines.push(`${argName}.${def.type}(${accessMessageField});`);
      }
    });
    return lines.join("\n    ");
  };

  let writerJs = "";
  let calculateSizeJs = "";

  namedTypes.forEach((t) => {
    writerJs += `
  function ${friendlyName(t.name)}(writer, message) {
    ${constructorBody(t, "writer")}
  };\n`;
    calculateSizeJs += `
  function ${friendlyName(t.name)}(offsetCalculator, message) {
    ${constructorBody(t, "offsetCalculator")}
  };\n`;
  });

  writerJs += `
  return function write(writer, message) {
    ${constructorBody(unnamedType, "writer")}
    return writer.data;
  };`;
  calculateSizeJs += `
  return function calculateSize(offsetCalculator, message) {
    ${constructorBody(unnamedType, "offsetCalculator")}
    return offsetCalculator.offset;
  };`;

  let write: (writer: StandardTypeWriter, message: unknown) => Uint8Array;
  let calculateSize: (offsetCalculator: StandardTypeOffsetCalculator, message: unknown) => number;
  try {
    // eslint-disable-next-line no-eval
    write = eval(`(function buildWriter() { ${writerJs} })()`);
  } catch (e) {
    console.error("error building writer:", writerJs);
    throw e;
  }
  try {
    // eslint-disable-next-line no-eval
    calculateSize = eval(`(function buildSizeCalculator() { ${calculateSizeJs} })()`);
  } catch (e) {
    console.error("error building size calculator:", calculateSizeJs);
    throw e;
  }

  return {
    writer: function (message: unknown, data: Uint8Array): Uint8Array {
      const writer = new StandardTypeWriter(data);
      return write(writer, message);
    },
    byteSizeCalculator(message: unknown): number {
      const offsetCalculator = new StandardTypeOffsetCalculator();
      return calculateSize(offsetCalculator, message);
    },
  };
}

export class MessageWriter {
  writer: (message: unknown, output: Uint8Array) => Uint8Array;
  byteSizeCalculator: (message: unknown) => number;

  // takes an object string message definition and returns
  // a message writer which can be used to write messages based
  // on the message definition
  constructor(definitions: RosMsgDefinition[]) {
    const { writer, byteSizeCalculator } = createWriterAndSizeCalculator(definitions);
    this.writer = writer;
    this.byteSizeCalculator = byteSizeCalculator;
  }

  // Calculates the byte size needed to write this message in bytes.
  calculateByteSize(message: unknown): number {
    return this.byteSizeCalculator(message);
  }

  // output is optional - if it is not provided, a Uint8Array will be generated.
  writeMessage(message: unknown, output?: Uint8Array): Uint8Array {
    if (output == undefined) {
      const dataSize = this.calculateByteSize(message);
      output = new Uint8Array(dataSize);
    }
    return this.writer(message, output);
  }
}
