// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

function isObject(o: unknown): boolean {
  return Object.prototype.toString.call(o) === "[object Object]";
}

// Returns true if an object was created by the Object constructor, Object.create(null), or {}.
export function isPlainObject(o: unknown): boolean {
  if (!isObject(o)) {
    return false;
  }

  // If has modified constructor
  const ctor = (o as Record<string, unknown>).constructor;
  if (ctor === undefined) {
    return true;
  }

  // If has modified prototype
  const prot = ctor.prototype;
  if (!isObject(prot)) {
    return false;
  }

  // If constructor does not have an Object-specific method
  // eslint-disable-next-line no-prototype-builtins
  if (prot.hasOwnProperty("isPrototypeOf") === false) {
    return false;
  }

  // Most likely a plain Object
  return true;
}

// Returns true if an object was created by the Object constructor, Object.create(null), or {}, and
// the object does not contain any enumerable keys.
export function isEmptyPlainObject(o: unknown): boolean {
  return isPlainObject(o) && Object.keys(o as Record<string, unknown>).length === 0;
}
