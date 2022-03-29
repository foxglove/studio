// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

export type StudioDefaultValue =
  | string
  | number
  | bigint
  | boolean
  | string[]
  | number[]
  | bigint[]
  | boolean[]
  | undefined;

export type StudioMsgField = {
  type: string;
  name: string;
  isComplex?: boolean;

  // For arrays
  isArray?: boolean;
  arrayLength?: number | undefined;

  // For constants
  isConstant?: boolean;
  value?: string | number | bigint | boolean | undefined;
  valueText?: string;

  // Sets a maximum upper bound on string length
  upperBound?: number;
  // Sets a maximum upper bound on array length
  arrayUpperBound?: number;
  // Default value to serialize or deserialize when no source value is present
  defaultValue?: StudioDefaultValue;

  optional?: boolean;
};

export type StudioMsgDefinition = {
  name?: string;
  definitions: StudioMsgField[];
};

export type StudioDatatypes = Map<string, StudioMsgDefinition>;
