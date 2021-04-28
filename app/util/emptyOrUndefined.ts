// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

export function isNonEmptyOrUndefined(str: string | undefined): str is string {
  return str != undefined && str.length !== 0;
}

export function nonEmptyOrUndefined(str: string | undefined): string | undefined {
  return str == undefined || str.length === 0 ? undefined : str;
}
