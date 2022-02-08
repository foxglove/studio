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
  ["int16", "Int16Array"],
  ["uint16", "Uint16Array"],
  ["int32", "Int32Array"],
  ["uint32", "Uint32Array"],
  ["int64", "BigInt64Array"],
  ["uint64", "BigUint64Array"],
  ["float32", "Float32Array"],
  ["float64", "Float64Array"],
]);

function safeString(str: string): string {
  return JSON.stringify(str) as string;
}

export const generateTypesInterface = (datatypes: RosDatatypes): string => {
  const seenDatatypes = new Set();
  let src = `
    /**
     * DataSourceTypes enumerates the message type definitions for for all the types
     * in the current data source.
     *
     * Use subtype notation to access the type by schema name:
     *
     * \`\`\`
     * type Msg = DataSourceTypes["geometry_msgs/Pose"];
     * type Msg = DataSourceTypes["pkg.geometry.Pose"];
     * \`\`\`
     */
    export type DataSourceTypes = {
  `;

  for (const [datatype, definition] of datatypes) {
    // Avoid adding a repeating datatype name again.
    // We shouldn't have this happen so we add a comment indicating it happened.
    if (seenDatatypes.has(datatype)) {
      src += `\n// ${datatype} appeared multiple times in datatypes`;
      continue;
    }
    seenDatatypes.add(datatype);

    src += `\n${safeString(datatype)}: {`;

    for (const field of definition.definitions) {
      const { type, isConstant, isArray } = field;
      const typedArray = typedArrayMap.get(type);
      const rosPrimitive = rosPrimitiveToTypescriptTypeMap.get(type);

      const fieldName = safeString(field.name);

      if (isConstant === true) {
        src += `\n // ${field.name} = ${field.valueText}`;
      } else if (isArray === true) {
        if (typedArray) {
          src += `\n${fieldName}: ${typedArray},`;
        } else if (rosPrimitive) {
          src += `\n${fieldName}: ${rosPrimitive}[],`;
        } else {
          src += `\n${fieldName}: DataSourceTypes[${safeString(type)}][],`;
        }
      } else {
        if (rosPrimitive) {
          src += `\n${fieldName}: ${rosPrimitive},`;
        } else {
          src += `\n${fieldName}: DataSourceTypes[${safeString(type)}],`;
        }
      }
    }

    src += "\n},";
  }

  src += "\n};";

  return src;
};

function generateTypesByTopicInterface(topics: Topic[]): string {
  let src = `
    /**
     * MessageEventByTopic enumerates the MessageEvent types for all the topics in
     * the current data source.
     *
     * Use subtype notation to access the MessageEvent type by topic name:
     *
     * \`\`\`
     * type MsgEventFoo = MessageEventByTopic["/foo"];
     * \`\`\`
     */
    export type MessageEventByTopic = {`;

  for (const topic of topics) {
    src += `${safeString(topic.name)}: MessageEvent<DataSourceTypes[${safeString(
      topic.datatype,
    )}], ${safeString(topic.name)}>,\n`;
  }

  src += "\n};";
  return src;
}

function generateDataSourceLib(args: Args): string {
  const typesByTopic = generateTypesByTopicInterface(args.topics);
  const types = generateTypesInterface(args.datatypes);

  const src = `
export type Time = {
  sec: number,
  nsec: number,
};

export type Duration = Time;

/**
 * MessageEvent contains a single message. The event has the topic, and the receive time.
 */
export interface MessageEvent<M, T = string> {
  topic: T;
  receiveTime: Time;
  message: M;
};

${types}

${typesByTopic}
`;

  return src;
}

let emptyLib: string | undefined;
function generateEmptyDataSourceLib(): string {
  if (emptyLib) {
    return emptyLib;
  }

  return (emptyLib = generateDataSourceLib({ topics: [], datatypes: new Map() }));
}

export { generateDataSourceLib, generateEmptyDataSourceLib };
