// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
//
// This file incorporates work covered by the following copyright and
// permission notice:
//
//   Copyright 2019-2021 Cruise LLC
//
//   This source code is licensed under the Apache License, Version 2.0,
//   found at http://www.apache.org/licenses/LICENSE-2.0
//   You may not use this file except in compliance with the License.

type DebouncedFn<Args extends unknown[]> = ((...args: Args) => void) & {
  // the currently executing promise - if any
  currentPromise?: Promise<void> | null;
};

// debouncePromise returns a function which wraps calls to `fn`.
// The returned debounceFn ensures that only one `fn` call is executing at a time.
// If debounceFn is called while `fn` is still executing, it will queue the call until the
// current invocation is complete.
// If debounceFn is called multiple times while `fn` is still executing, then only the last
// call's arguments will be saved for the next execution of `fn`.
export default function debouncePromise<Args extends unknown[]>(
  fn: (...args: Args) => Promise<void>,
): DebouncedFn<Args> {
  // If another call is in progress, store the latest args and wait for current call to finish
  let callPending: Args | undefined;

  const debouncedFn: DebouncedFn<Args> = async (...args: Args) => {
    // if we are already in a call, prepare args for the next call
    if (callPending) {
      callPending = args;
      return;
    }

    callPending = args;

    // keep going while there are pending calls
    while (callPending) {
      // grab call args to compare if we need to call again after our call is done
      const callArgs = callPending;

      debouncedFn.currentPromise = fn(...callArgs).finally(() => {
        // if the original call args remained unchanged, we have no further calls
        if (callPending === callArgs) {
          callPending = undefined;
        }
        debouncedFn.currentPromise = undefined;
      });

      // suppress any rejections from currentPromise and move on to next call
      // The user can still attach their own .catch handlers to currentPromise directly
      try {
        await debouncedFn.currentPromise;
      } catch (err) {
        // no-op
      }
    }

    return;
  };

  return debouncedFn;
}
