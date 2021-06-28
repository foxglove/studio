// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { CdrReader } from "@foxglove/cdr";
import { RosMsgDefinition, RosMsgField } from "@foxglove/rosmsg";

export class MessageReader<T = unknown> {
  definitions: RosMsgDefinition[];

  constructor(definitions: RosMsgDefinition[]) {
    this.definitions = definitions;
  }

  size(buffer: Readonly<Uint8Array>): number {
    return buffer.byteLength;
  }

  source(): string {
    return "";
  }

  // Create a LazyMessage for the buffer
  // We template on R here for call site type information if the class type information T is not
  // known or available
  readMessage<R = T>(buffer: Readonly<Uint8Array>): R {
    const reader = new CdrReader(buffer);
    const msg: Record<string, unknown> = {};
    for (const definition of this.definitions) {
      for (const field of definition.definitions) {
      }
    }
    return msg as R;
  }
}

function readField(field: RosMsgField, reader: CdrReader, msg: Record<string, unknown>) {
  if (field.isConstant === true) {
    return;
  } else if (field.isArray === true) {
    const length = reader.sequenceLength();
    const array = [];
    // FIXME: Need to resolve field.type to something
    for (let i = 0; i < length; i++) {
      // FIXME: How to handle arrays of complex types and arrays of primitives
      array.push(readField(?, reader, msg));
    }
    msg[field.name] = array;
  } else if (field.isComplex === true) {
    // FIXME
  } else {
    msg[field.name] = readPrimitive(field.type, reader);
  }
}

function readPrimitive(type: string, reader: CdrReader): unknown {
  switch (type) {
    case "int8":
      return reader.int8();
    case "uint8":
      return reader.uint8();
    case "float64":
      return reader.float64();
    case "string":
      return reader.string();
  }
  return undefined;
}
