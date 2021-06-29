// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { CdrReader } from "@foxglove/cdr";
import { RosMsgDefinition, RosMsgField } from "@foxglove/rosmsg";

import { Time } from "@foxglove/rostime";

export type Deserializer = (reader: CdrReader) => boolean | number | bigint | string | Time;
export type ArrayDeserializer = (
  reader: CdrReader,
  count: number,
) =>
  | boolean[]
  | Int8Array
  | Uint8Array
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | BigInt64Array
  | BigUint64Array
  | Float32Array
  | Float64Array
  | string[]
  | Time[];

export class MessageReader<T = unknown> {
  rootDefinition: RosMsgField[];
  definitions: Map<string, RosMsgField[]>;

  constructor(definitions: RosMsgDefinition[]) {
    const rootDefinition = definitions[0];
    if (rootDefinition == undefined) {
      throw new Error("MessageReader initialized with no root RosMsgDefinition");
    }
    this.rootDefinition = rootDefinition.definitions;
    this.definitions = new Map<string, RosMsgField[]>(
      definitions.map((def) => [def.name, def.definitions]),
    );
  }

  // We template on R here for call site type information if the class type information T is not
  // known or available
  readMessage<R = T>(buffer: Readonly<Uint8Array>): R {
    const reader = new CdrReader(buffer);
    return this.readComplexType(this.rootDefinition, reader) as R;
  }

  private readComplexType(definition: RosMsgField[], reader: CdrReader): Record<string, unknown> {
    const msg: Record<string, unknown> = {};
    for (const field of definition) {
      if (field.isConstant === true) {
        continue;
      }

      if (field.isComplex === true) {
        // Complex type
        const nestedDefinition = this.definitions.get(field.type);
        if (nestedDefinition == undefined) {
          throw new Error(`Unrecognized complex type ${field.type}`);
        }

        if (field.isArray === true) {
          // For dynamic length arrays we need to read a uint32 prefix
          const arrayLength = field.arrayLength ?? reader.sequenceLength();
          const array = [];
          for (let i = 0; i < arrayLength; i++) {
            array.push(this.readComplexType(nestedDefinition, reader));
          }
          msg[field.name] = array;
        } else {
          msg[field.name] = this.readComplexType(nestedDefinition, reader);
        }
      } else {
        // Primitive type
        if (field.isArray === true) {
          const deser = typedArrayDeserializers.get(field.type);
          if (deser == undefined) {
            throw new Error(`Unrecognized primitive array type ${field.type}[]`);
          }
          // For dynamic length arrays we need to read a uint32 prefix
          const arrayLength = field.arrayLength ?? reader.sequenceLength();
          msg[field.name] = deser(reader, arrayLength);
        } else {
          const deser = deserializers.get(field.type);
          if (deser == undefined) {
            throw new Error(`Unrecognized primitive type ${field.type}`);
          }
          msg[field.name] = deser(reader);
        }
      }
    }
    return msg;
  }
}

const deserializers = new Map<string, Deserializer>([
  ["bool", (reader) => Boolean(reader.int8())],
  ["int8", (reader) => reader.int8()],
  ["uint8", (reader) => reader.uint8()],
  ["int16", (reader) => reader.int16()],
  ["uint16", (reader) => reader.uint16()],
  ["int32", (reader) => reader.int32()],
  ["uint32", (reader) => reader.uint32()],
  ["int64", (reader) => reader.int64()],
  ["uint64", (reader) => reader.uint64()],
  ["float32", (reader) => reader.float32()],
  ["float64", (reader) => reader.float64()],
  ["string", (reader) => reader.string()],
  ["time", (reader) => ({ sec: reader.int32(), nsec: reader.int32() })],
  ["duration", (reader) => ({ sec: reader.int32(), nsec: reader.int32() })],
]);

const typedArrayDeserializers = new Map<string, ArrayDeserializer>([
  ["bool", readBoolArray],
  ["int8", (reader, count) => reader.int8Array(count)],
  ["uint8", (reader, count) => reader.uint8Array(count)],
  ["int16", (reader, count) => reader.int16Array(count)],
  ["uint16", (reader, count) => reader.uint16Array(count)],
  ["int32", (reader, count) => reader.int32Array(count)],
  ["uint32", (reader, count) => reader.uint32Array(count)],
  ["int64", (reader, count) => reader.int64Array(count)],
  ["uint64", (reader, count) => reader.uint64Array(count)],
  ["float32", (reader, count) => reader.float32Array(count)],
  ["float64", (reader, count) => reader.float64Array(count)],
  ["string", readStringArray],
  ["time", readTimeArray],
  ["duration", readTimeArray],
]);

function readBoolArray(reader: CdrReader, count: number): boolean[] {
  const array = new Array<boolean>(count);
  for (let i = 0; i < count; i++) {
    array[i] = Boolean(reader.int8());
  }
  return array;
}

function readStringArray(reader: CdrReader, count: number): string[] {
  const array = new Array<string>(count);
  for (let i = 0; i < count; i++) {
    array[i] = reader.string();
  }
  return array;
}

function readTimeArray(reader: CdrReader, count: number): Time[] {
  const array = new Array<Time>(count);
  for (let i = 0; i < count; i++) {
    const sec = reader.int32();
    const nsec = reader.int32();
    array[i] = { sec, nsec };
  }
  return array;
}
