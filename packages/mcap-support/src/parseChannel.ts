// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { MessageDefinition, MessageDefinitionField } from "@foxglove/message-definition";
import { IDLMessageDefinition, parseIDL } from "@foxglove/omgidl-parser";
import { MessageReader as OmgidlMessageReader } from "@foxglove/omgidl-serialization";
import { parseRos2idl } from "@foxglove/ros2idl-parser";
import { parse as parseMessageDefinition } from "@foxglove/rosmsg";
import { MessageReader } from "@foxglove/rosmsg-serialization";
import { MessageReader as ROS2MessageReader } from "@foxglove/rosmsg2-serialization";

import { parseFlatbufferSchema } from "./parseFlatbufferSchema";
import { parseJsonSchema } from "./parseJsonSchema";
import { parseProtobufSchema } from "./parseProtobufSchema";
import { MessageDefinitionMap } from "./types";

type Channel = {
  messageEncoding: string;
  schema: { name: string; encoding: string; data: Uint8Array } | undefined;
};
type FieldCount = Map<string, number>;

export type ParsedChannel = {
  deserialize: (data: ArrayBufferView) => unknown;
  datatypes: MessageDefinitionMap;
  // Guesstimate of the memory size in bytes of a deserialized message object
  approxDeserializedMsgSize: number;
};

function parseIDLDefinitionsToDatatypes(
  parsedDefinitions: IDLMessageDefinition[],
  rootName?: string,
) {
  //  The only IDL definition non-conformant-to-MessageDefinition is unions
  const convertUnionToMessageDefinition = (definition: IDLMessageDefinition): MessageDefinition => {
    if (definition.aggregatedKind === "union") {
      const innerDefs: MessageDefinitionField[] = definition.cases.map((caseDefinition) => ({
        ...caseDefinition.type,
        predicates: caseDefinition.predicates,
      }));

      if (definition.defaultCase != undefined) {
        innerDefs.push(definition.defaultCase);
      }
      const { name } = definition;
      return {
        name,
        definitions: innerDefs,
      };
    }
    return definition;
  };

  const standardDefs: MessageDefinition[] = parsedDefinitions.map(convertUnionToMessageDefinition);
  return parsedDefinitionsToDatatypes(standardDefs, rootName);
}

function parsedDefinitionsToDatatypes(
  parsedDefinitions: MessageDefinition[],
  rootName?: string,
): MessageDefinitionMap {
  const datatypes: MessageDefinitionMap = new Map();
  parsedDefinitions.forEach(({ name, definitions }, index) => {
    if (rootName != undefined && index === 0) {
      datatypes.set(rootName, { name: rootName, definitions });
    } else if (name != undefined) {
      datatypes.set(name, { name, definitions });
    }
  });
  return datatypes;
}

/**
 * Calculate the expected occurence of primitive field for a given schema.
 */
function getFieldCount(datatypes: MessageDefinitionMap, typeName: string): FieldCount {
  const fieldCount: FieldCount = new Map();
  getFieldCountRecursive(datatypes, typeName, fieldCount, []);
  return fieldCount;
}

function getFieldCountRecursive(
  datatypes: MessageDefinitionMap,
  typeName: string,
  fieldCount: FieldCount,
  checkedTypes: string[],
): void {
  if (datatypes.size === 0) {
    return; // Empty schema.
  }

  const definition = datatypes.get(typeName);
  if (!definition) {
    throw new Error(`Type '${typeName}' not found in definitions`);
  }

  for (const field of definition.definitions) {
    const expectedArrayLength = field.arrayLength ?? field.arrayUpperBound ?? 1;
    if (field.isComplex ?? false) {
      if (checkedTypes.includes(field.type)) {
        continue; // Bail out to avoid infinite loop
      }
      for (let i = 0; i < expectedArrayLength; i++) {
        getFieldCountRecursive(datatypes, field.type, fieldCount, checkedTypes.concat(field.type));
      }
    } else if (field.isArray ?? false) {
      fieldCount.set(field.type, (fieldCount.get(field.type) ?? 0) + expectedArrayLength);
    } else if (!(field.isConstant ?? false)) {
      fieldCount.set(field.type, (fieldCount.get(field.type) ?? 0) + 1);
    }
  }
}

/**
 * Guesstimate the size in bytes of a deserialized message object with the estimated amount of
 * primitive fields.
 */
function guesstimateDeserializedMsgSize(fieldCount: FieldCount): number {
  const totalFieldCount = [...fieldCount.values()].reduce((a, b) => a + b, 0);
  let sizeInBytes = totalFieldCount * 16; // Object properties take up space as well
  for (const [fieldName, count] of fieldCount.entries()) {
    switch (fieldName) {
      case "bool":
      case "int8":
      case "uint8":
      case "int16":
      case "uint16":
        sizeInBytes += 8 * count; // small integer
        break;
      case "int32":
      case "uint32":
      case "float32":
      case "float64":
        sizeInBytes += 12 * count; // heapnumber
        break;
      case "int64":
      case "uint64":
        sizeInBytes += 16 * count; // bigint
        break;
      case "string":
        sizeInBytes += 64 * count; // can't predict the string size, assume a certain length
        break;
      case "time":
      case "duration":
        sizeInBytes += 2 * 12 * count; // 2 x heapnumber
        break;
      default:
        throw new Error(`Unknown primitive type ${fieldName}`);
    }
  }
  return sizeInBytes;
}

/**
 * Process a channel/schema and extract information that can be used to deserialize messages on the
 * channel, and schemas in the format expected by Studio's RosDatatypes.
 *
 * See:
 * - https://github.com/foxglove/mcap/blob/main/docs/specification/well-known-message-encodings.md
 * - https://github.com/foxglove/mcap/blob/main/docs/specification/well-known-schema-encodings.md
 */
export function parseChannel(channel: Channel): ParsedChannel {
  if (channel.messageEncoding === "json") {
    if (channel.schema != undefined && channel.schema.encoding !== "jsonschema") {
      throw new Error(
        `Message encoding ${channel.messageEncoding} with schema encoding '${channel.schema.encoding}' is not supported (expected jsonschema or no schema)`,
      );
    }
    const textDecoder = new TextDecoder();
    let datatypes: MessageDefinitionMap = new Map();
    let deserialize = (data: ArrayBufferView) => JSON.parse(textDecoder.decode(data));
    if (channel.schema != undefined) {
      const schema =
        channel.schema.data.length > 0
          ? JSON.parse(textDecoder.decode(channel.schema.data))
          : undefined;
      if (schema != undefined) {
        if (typeof schema !== "object") {
          throw new Error(`Invalid schema, expected JSON object, got ${typeof schema}`);
        }
        const { datatypes: parsedDatatypes, postprocessValue } = parseJsonSchema(
          schema as Record<string, unknown>,
          channel.schema.name,
        );
        datatypes = parsedDatatypes;
        deserialize = (data) =>
          postprocessValue(JSON.parse(textDecoder.decode(data)) as Record<string, unknown>);
      }
    }
    const fieldCount = getFieldCount(datatypes, channel.schema?.name ?? "");
    const approxDeserializedMsgSize = guesstimateDeserializedMsgSize(fieldCount);
    return { deserialize, datatypes, approxDeserializedMsgSize };
  }

  if (channel.messageEncoding === "flatbuffer") {
    if (channel.schema?.encoding !== "flatbuffer") {
      throw new Error(
        `Message encoding ${channel.messageEncoding} with ${
          channel.schema == undefined
            ? "no encoding"
            : `schema encoding '${channel.schema.encoding}'`
        } is not supported (expected flatbuffer)`,
      );
    }
    const { datatypes, deserialize } = parseFlatbufferSchema(
      channel.schema.name,
      channel.schema.data,
    );
    const fieldCount = getFieldCount(datatypes, channel.schema.name);
    return {
      datatypes,
      deserialize,
      approxDeserializedMsgSize: guesstimateDeserializedMsgSize(fieldCount),
    };
  }

  if (channel.messageEncoding === "protobuf") {
    if (channel.schema?.encoding !== "protobuf") {
      throw new Error(
        `Message encoding ${channel.messageEncoding} with ${
          channel.schema == undefined
            ? "no encoding"
            : `schema encoding '${channel.schema.encoding}'`
        } is not supported (expected protobuf)`,
      );
    }
    const { datatypes, deserialize } = parseProtobufSchema(
      channel.schema.name,
      channel.schema.data,
    );
    const fieldCount = getFieldCount(datatypes, channel.schema.name);
    return {
      datatypes,
      deserialize,
      approxDeserializedMsgSize: guesstimateDeserializedMsgSize(fieldCount),
    };
  }

  if (channel.messageEncoding === "ros1") {
    if (channel.schema?.encoding !== "ros1msg") {
      throw new Error(
        `Message encoding ${channel.messageEncoding} with ${
          channel.schema == undefined
            ? "no encoding"
            : `schema encoding '${channel.schema.encoding}'`
        } is not supported (expected ros1msg)`,
      );
    }
    const schema = new TextDecoder().decode(channel.schema.data);
    const parsedDefinitions = parseMessageDefinition(schema);
    const reader = new MessageReader(parsedDefinitions);
    const datatypes = parsedDefinitionsToDatatypes(parsedDefinitions, channel.schema.name);
    const fieldCount = getFieldCount(datatypes, channel.schema.name);
    return {
      datatypes: parsedDefinitionsToDatatypes(parsedDefinitions, channel.schema.name),
      deserialize: (data) => reader.readMessage(data),
      approxDeserializedMsgSize: guesstimateDeserializedMsgSize(fieldCount),
    };
  }

  if (channel.messageEncoding === "cdr") {
    if (
      channel.schema?.encoding !== "ros2msg" &&
      channel.schema?.encoding !== "ros2idl" &&
      channel.schema?.encoding !== "omgidl"
    ) {
      throw new Error(
        `Message encoding ${channel.messageEncoding} with ${
          channel.schema == undefined
            ? "no encoding"
            : `schema encoding '${channel.schema.encoding}'`
        } is not supported (expected "ros2msg" or "ros2idl")`,
      );
    }
    const schema = new TextDecoder().decode(channel.schema.data);
    if (channel.schema.encoding === "omgidl") {
      const parsedDefinitions = parseIDL(schema);
      const reader = new OmgidlMessageReader(channel.schema.name, parsedDefinitions);
      const datatypes = parseIDLDefinitionsToDatatypes(parsedDefinitions);
      const fieldCount = getFieldCount(datatypes, channel.schema.name);
      return {
        datatypes,
        deserialize: (data) => reader.readMessage(data),
        approxDeserializedMsgSize: guesstimateDeserializedMsgSize(fieldCount),
      };
    } else {
      const isIdl = channel.schema.encoding === "ros2idl";

      const parsedDefinitions = isIdl
        ? parseRos2idl(schema)
        : parseMessageDefinition(schema, { ros2: true });

      const reader = new ROS2MessageReader(parsedDefinitions);
      const datatypes = parsedDefinitionsToDatatypes(parsedDefinitions, channel.schema.name);
      const fieldCount = getFieldCount(datatypes, channel.schema.name);
      return {
        datatypes,
        deserialize: (data) => reader.readMessage(data),
        approxDeserializedMsgSize: guesstimateDeserializedMsgSize(fieldCount),
      };
    }
  }

  throw new Error(`Unsupported encoding ${channel.messageEncoding}`);
}
