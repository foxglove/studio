// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as React from "react";

import Logger from "@foxglove/log";

const log = Logger.getLogger(__filename);

function logChanges(name: string, prevValues: { current: unknown[] | undefined }, deps: unknown[]) {
  const reason = (() => {
    if (!prevValues.current) {
      return "first render";
    }
    if (prevValues.current.length !== deps.length) {
      return `deps.length changed from ${prevValues.current.length} to ${deps.length}`;
    } else {
      const changes = [];
      for (let i = 0; i < deps.length; i++) {
        if (deps[i] !== prevValues.current[i]) {
          log.info(`deps[${i}] changed from`, prevValues.current[i], "to", deps[i]);
          changes.push(`deps[${i}] changed`);
        }
      }
      if (changes.length > 0) {
        return changes.join(", ");
      }
    }
    throw new Error("Unknown reason :(");
  })();
  console.warn(`Running ${name} callback because: ${reason}`);
}

export function useEffect(effect: () => void | (() => void), deps: unknown[]): void {
  const prevDeps = React.useRef<unknown[] | undefined>();
  React.useEffect(() => {
    logChanges("useEffect", prevDeps, deps);
    prevDeps.current = deps;
    return effect();
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}

export function useMemo<T>(callback: () => T, deps: unknown[]): T {
  const prevDeps = React.useRef<unknown[] | undefined>();
  return React.useMemo(() => {
    logChanges("useMemo", prevDeps, deps);
    prevDeps.current = deps;
    return callback();
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}
