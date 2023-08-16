// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
//
// This file incorporates work covered by the following copyright and
// permission notice:
//
//   Copyright 2018-2021 Cruise LLC
//
//   This source code is licensed under the Apache License, Version 2.0,
//   found at http://www.apache.org/licenses/LICENSE-2.0
//   You may not use this file except in compliance with the License.

import { iterateTyped } from "@foxglove/studio-base/components/Chart/datasets";

import { datumToTyped } from "./datasets";
import { TypedData, Datum } from "./internalTypes";

export type MathFunction = (arg: number) => number;

export function derivative(data: TypedData[]): TypedData[] {
  const newDatums: Datum[] = [];

  let prevX: number = 0;
  let prevY: number = 0;
  for (const datum of iterateTyped(data)) {
    if (datum.index === 0) {
      prevX = datum.x;
      prevY = datum.y;
      continue;
    }

    const secondsDifference = datum.x - prevX;
    const value = (datum.y - prevY) / secondsDifference;
    newDatums.push({
      ...datum,
      y: value,
      value,
    });
    prevX = datum.x;
    prevY = datum.y;
  }

  return [datumToTyped(newDatums)];
}

export const mathFunctions: { [fn: string]: MathFunction } = {
  abs: Math.abs,
  acos: Math.acos,
  asin: Math.asin,
  atan: Math.atan,
  ceil: Math.ceil,
  cos: Math.cos,
  log: Math.log,
  log1p: Math.log1p,
  log2: Math.log2,
  log10: Math.log10,
  round: Math.round,
  sign: Math.sign,
  sin: Math.sin,
  sqrt: Math.sqrt,
  tan: Math.tan,
  trunc: Math.trunc,
  negative: (value: number) => -value,
  deg2rad: (degrees: number) => degrees * (Math.PI / 180),
  rad2deg: (radians: number) => radians * (180 / Math.PI),
};

export function applyToDatum<T extends { y: number | string | bigint }>(
  datum: T,
  func: MathFunction,
): T {
  let { y } = datum;
  const numericYValue: number = Number(y);
  // Only apply the function if the Y value is a valid number.
  if (!isNaN(numericYValue)) {
    y = func(numericYValue);
  }
  return { ...datum, y, value: y };
}
