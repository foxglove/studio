// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { TimestampMethod } from "@foxglove/studio-base/util/time";

export type StateTransitionPath = {
  color?: string;
  value: string;
  label?: string;
  enabled?: boolean;
  timestampMethod: TimestampMethod;
};

export type StateTransitionConfig = {
  paths: StateTransitionPath[];
  isSynced: boolean;
};

function presence<T>(value: undefined | T): undefined | T {
  if (value === "") {
    return undefined;
  }

  return value == undefined ? undefined : value;
}

export function stateTransitionPathDisplayName(
  path: Readonly<StateTransitionPath>,
  index: number,
): string {
  return presence(path.label) ?? presence(path.value) ?? `Series ${index + 1}`;
}
