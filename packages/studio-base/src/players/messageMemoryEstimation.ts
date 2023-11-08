// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { MessageDefinitionMap } from "@foxglove/mcap-support/src/types";

const OBJECT_BASE_SIZE = 12;
const TYPED_ARRAY_BASE_SIZE = 64; // byteLength, byteOffset, ...
const MAX_NUM_FAST_PROPERTIES = 1020;
const FIELD_SIZE_BY_PRIMITIVE: Record<string, number> = {
  bool: 4,
  int8: 4,
  uint8: 4,
  int16: 4,
  uint16: 4,
  int32: 8,
  uint32: 8,
  float32: 16,
  float64: 16,
  int64: 16,
  uint64: 16,
  string: 20, // we don't know the length upfront, assume a fixed length
  time: 32,
  duration: 32,
};

/**
 * Estimates the memory size of a deserialized message object based on the schema definition.
 *
 * The estimation is by no means accurate but may in certain situations (especially when there are
 * no dynamic fields such as arrays or strings) give a better estimation than the number of bytes
 * of the serialized message. For estimating memory size, we assume a V8 JS engine (probably
 * similar for other engines).
 *
 * @param datatypes Map of data types
 * @param typeName Name of the data type
 * @param knownTypeSizes Map of known type sizes (for caching purposes)
 * @returns Estimated object size in bytes
 */
export function estimateMessageObjectSize(
  datatypes: MessageDefinitionMap,
  typeName: string,
  knownTypeSizes: Map<string, number>,
  checkedTypes?: string[],
): number {
  const knownSize = knownTypeSizes.get(typeName);
  if (knownSize != undefined) {
    return knownSize;
  }

  if (datatypes.size === 0) {
    return OBJECT_BASE_SIZE; // Empty schema -> Empty object.
  }

  const definition = datatypes.get(typeName);
  if (!definition) {
    throw new Error(`Type '${typeName}' not found in definitions`);
  }

  let sizeInBytes = OBJECT_BASE_SIZE;

  const nonConstantFields = definition.definitions.filter((field) => !(field.isConstant ?? false));
  if (nonConstantFields.length > MAX_NUM_FAST_PROPERTIES) {
    // If there are too many properties, V8 stores Objects in dictionary mode (slow properties)
    // with each object having a self-contained dictionary. This dictionary contains the key, value
    // and details of properties. Below we estimate the size of this additional dictionary. Formula
    // adapted from
    // medium.com/@bpmxmqd/v8-engine-jsobject-structure-analysis-and-memory-optimization-ideas-be30cfcdcd16
    const propertiesDictSize =
      16 + 5 * 8 + 2 ** Math.ceil(Math.log2((nonConstantFields.length + 2) * 1.5)) * 3 * 4;
    sizeInBytes += propertiesDictSize;

    // In return, properties are no longer stored in the properties array
    sizeInBytes -= 4 * nonConstantFields.length;
  }

  for (const field of nonConstantFields) {
    if (field.isComplex ?? false) {
      const count =
        field.isArray === true
          ? // We are conservative and assume an empty array to avoid memory overestimation.
            field.arrayLength ?? 0
          : 1;

      const knownFieldSize = knownTypeSizes.get(field.type);
      if (knownFieldSize != undefined) {
        sizeInBytes += count > 0 ? count * knownFieldSize : OBJECT_BASE_SIZE;
        continue;
      }

      if (checkedTypes != undefined && checkedTypes.includes(field.type)) {
        // E.g. protobuf allows types to reference itself.
        // For that reason we bail out here to avoid an infinite loop.
        continue;
      }

      const complexTypeObjectSize = estimateMessageObjectSize(
        datatypes,
        field.type,
        knownTypeSizes,
        (checkedTypes ?? []).concat(field.type),
      );
      sizeInBytes += count > 0 ? count * complexTypeObjectSize : OBJECT_BASE_SIZE;
    } else if (field.isArray === true) {
      // We are conservative and assume an empty array to avoid memory overestimation.
      // For dynamic messages it is better to use another estimator such as the serialized
      // message size.
      const arrayLength = field.arrayLength ?? 0;
      switch (field.type) {
        // Assume that fields get deserialized as typed arrays
        case "int8":
        case "uint8":
          sizeInBytes += TYPED_ARRAY_BASE_SIZE + arrayLength * 1;
          break;
        case "int16":
        case "uint16":
          sizeInBytes += TYPED_ARRAY_BASE_SIZE + arrayLength * 2;
          break;
        case "int32":
        case "uint32":
        case "float32":
          sizeInBytes += TYPED_ARRAY_BASE_SIZE + arrayLength * 4;
          break;
        case "float64":
        case "int64":
        case "uint64":
          sizeInBytes += TYPED_ARRAY_BASE_SIZE + arrayLength * 8;
          break;
        default:
          {
            const primitiveSize = FIELD_SIZE_BY_PRIMITIVE[field.type];
            if (primitiveSize == undefined) {
              throw new Error(`Unknown primitive type ${field.type}`);
            }
            // Assume Array<type> deserialization
            sizeInBytes += arrayLength * primitiveSize + OBJECT_BASE_SIZE;
          }
          break;
      }
    } else {
      const primitiveSize = FIELD_SIZE_BY_PRIMITIVE[field.type];
      if (primitiveSize == undefined) {
        throw new Error(`Unknown primitive type ${field.type}`);
      }
      sizeInBytes += primitiveSize;
    }
  }

  knownTypeSizes.set(typeName, sizeInBytes);

  return sizeInBytes;
}
