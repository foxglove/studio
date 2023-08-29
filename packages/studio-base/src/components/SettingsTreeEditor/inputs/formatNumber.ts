// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

/**
 * Format n to precision decimals, trimming any trailing zeroes.
 *
 * @param n value to format
 * @param precision number of decimals of desired precision
 */
export function formatNumber(n: undefined, precision: number): undefined;
export function formatNumber(n: number, precision: number): number;
export function formatNumber(n: undefined | number, precision: number): undefined | number;
export function formatNumber(n: undefined | number, precision: number): undefined | number {
  if (n == undefined) {
    return undefined;
  }

  return Number(n.toFixed(precision));
}
