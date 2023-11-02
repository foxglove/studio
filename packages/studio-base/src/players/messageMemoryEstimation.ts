// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { MessageDefinitionMap } from "@foxglove/mcap-support/src/types";

/**
 * Calculate the expected occurence of primitive field for a given schema.
 */
function getFieldCount(datatypes: MessageDefinitionMap, typeName: string): Map<string, number> {
  const fieldCount = new Map<string, number>();
  getFieldCountRecursive(datatypes, typeName, fieldCount, []);
  return fieldCount;
}

function getFieldCountRecursive(
  datatypes: MessageDefinitionMap,
  typeName: string,
  fieldCount: Map<string, number>,
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
export function guesstimateDeserializedMsgSize(
  datatypes: MessageDefinitionMap,
  typeName: string,
): number {
  const fieldCount = getFieldCount(datatypes, typeName);
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
