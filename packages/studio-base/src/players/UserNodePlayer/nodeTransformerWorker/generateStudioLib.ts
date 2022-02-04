// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Topic } from "@foxglove/studio-base/players/types";
import { RosDatatypes } from "@foxglove/studio-base/types/RosDatatypes";

type Args = {
  topics: Topic[];
  datatypes: RosDatatypes;
};

// http://wiki.ros.org/msg
const rosPrimitiveToTypescriptTypeMap = new Map<string, string>([
  ["uint8", "number"],
  ["int8", "number"],
  ["uint16", "number"],
  ["int16", "number"],
  ["uint32", "number"],
  ["int32", "number"],
  ["float32", "number"],
  ["float64", "number"],
  ["int64", "number"],
  ["uint64", "number"],
  ["string", "string"],
  ["bool", "boolean"],
  ["time", "Time"],
  ["duration", "Duration"],
]);

export const typedArrayMap = new Map<string, string>([
  ["uint8", "Uint8Array"],
  ["int8", "Int8Array"],
]);

export const generateTypesInterface = (datatypes: RosDatatypes): string => {
  const seenDatatypes = new Set();
  let src = "declare interface Types {";

  for (const [datatype, definition] of datatypes) {
    // Avoid adding a repeating datatype name again.
    // We shouldn't have this happen so we add a comment indicating it happened.
    if (seenDatatypes.has(datatype)) {
      src += `\n// ${datatype} appeared multiple times in datatypes`;
      continue;
    }
    seenDatatypes.add(datatype);

    src += `\n"${datatype}": {`;

    for (const field of definition.definitions) {
      const { type, isConstant, isArray } = field;
      const typedArray = typedArrayMap.get(type);
      const rosPrimitive = rosPrimitiveToTypescriptTypeMap.get(type);

      if (isConstant === true) {
        src += `\n // ${field.name} = ${field.valueText}`;
      } else if (isArray === true) {
        if (typedArray) {
          src += `\n${field.name}: ${typedArray},`;
        } else if (rosPrimitive) {
          src += `\n${field.name}: ${rosPrimitive}[],`;
        } else {
          src += `\n${field.name}: Types["${type}"][],`;
        }
      } else {
        if (rosPrimitive) {
          src += `\n${field.name}: ${rosPrimitive},`;
        } else {
          src += `\n${field.name}: Types["${type}"],`;
        }
      }
    }

    src += "\n};";
  }

  src += "\n}\n";

  return src;
};

function generateTypesByTopicInterface(topics: Topic[]): string {
  let src = "declare interface TypesByTopic {";

  for (const topic of topics) {
    src += `"${topic.name}": MessageEvent<Types["${topic.datatype}"]>;`;
  }

  src += "\n}";
  return src;
}

function generateStudioLib(args: Args): string {
  const typesByTopic = generateTypesByTopicInterface(args.topics);
  const types = generateTypesInterface(args.datatypes);

  const src = `
type Time = {
  sec: number;
  nsec: number;
}

type Duration = Time;

declare interface MessageEvent<T> {
  topic: T;
  receiveTime: Time;
  message: T;
}

${types}

${typesByTopic}

export { Types, TypesByTopic };
`;

  return src;
}

export { generateStudioLib };
