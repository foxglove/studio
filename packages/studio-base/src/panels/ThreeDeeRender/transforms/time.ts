// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

export type Time = bigint;
export type Duration = bigint;

const ONE_SECOND_NS = BigInt(1e9);

export function compareTime(a: Time, b: Time): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function toSec(time: Time): number {
  const sec = Number(time / ONE_SECOND_NS);
  const nsec = Number(time % ONE_SECOND_NS);
  return sec + nsec * 1e-9;
}

export function fromSec(value: number): Time {
  let sec = Math.trunc(value);
  let nsec = Math.round((value - sec) * 1e9);
  sec += Math.trunc(nsec / 1e9);
  nsec %= 1e9;
  return BigInt(sec) * ONE_SECOND_NS + BigInt(nsec);
}

export function percentOf(start: Time, end: Time, target: Time): number {
  const totalDuration = end - start;
  const targetDuration = target - start;
  return Number(targetDuration) / Number(totalDuration);
}

export function interpolate(start: Time, end: Time, fraction: number): Time {
  const duration = Number(end - start);
  return start + BigInt(Math.round(duration * fraction));
}
