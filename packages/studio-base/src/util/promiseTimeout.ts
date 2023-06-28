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

async function promiseTimeout<T>(
  promise: Promise<T>,
  ms = 30000,
  reason = "unknown reason",
): Promise<T> {
  // We avoid using Promise.race here since it is succeptible to memory leaks for unresolved promises
  // https://github.com/nodejs/node/issues/17469
  //
  // With Promise.race you might be tempted to race the input promise against a promise that resolve
  // after a timeout. However, if you clear the timeout when the input promise resolves, you'll be
  // left with a promise that never resolves passed as a contender to `Promise.race`.
  return await new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => {
      reject(new Error(`Promise timed out after ${ms}ms: ${reason} `));
    }, ms);
    promise.then(resolve, reject).finally(() => {
      clearTimeout(id);
    });
  });
}

export default promiseTimeout;
