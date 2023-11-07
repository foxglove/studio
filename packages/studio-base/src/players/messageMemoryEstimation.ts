// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { MessageDefinitionMap } from "@foxglove/mcap-support/src/types";

/**
 * Calculate the expected occurence of primitive field for a given schema.
 */
function getFieldTypeCount(datatypes: MessageDefinitionMap, typeName: string): Map<string, number> {
  const fieldTypeCount = new Map<string, number>();
  getFieldTypeCountRecursive({ datatypes, typeName, fieldTypeCount, checkedTypes: [] });
  return fieldTypeCount;
}

function getFieldTypeCountRecursive(args: {
  datatypes: MessageDefinitionMap;
  typeName: string;
  fieldTypeCount: Map<string, number>;
  checkedTypes: string[];
}): void {
  const { datatypes, typeName, fieldTypeCount, checkedTypes } = args;
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
        getFieldTypeCountRecursive({
          datatypes,
          typeName: field.type,
          fieldTypeCount,
          checkedTypes: checkedTypes.concat(field.type),
        });
      }
    } else if (field.isArray ?? false) {
      fieldTypeCount.set(field.type, (fieldTypeCount.get(field.type) ?? 0) + expectedArrayLength);
    } else if (!(field.isConstant ?? false)) {
      fieldTypeCount.set(field.type, (fieldTypeCount.get(field.type) ?? 0) + 1);
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
  const fieldTypeCount = getFieldTypeCount(datatypes, typeName);
  const numFields = [...fieldTypeCount.values()].reduce((a, b) => a + b, 0);
  let sizeInBytes = numFields * 16; // Object properties take up space as well
  for (const [fieldType, count] of fieldTypeCount.entries()) {
    switch (fieldType) {
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
        throw new Error(`Unknown primitive type ${fieldType}`);
    }
  }
  return sizeInBytes;
}
