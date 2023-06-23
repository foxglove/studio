// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

type Deferred = { resolve: (value: unknown) => void; reject: (reason?: unknown) => void };

const deferredsByPromise = new WeakMap<
  PromiseLike<unknown>,
  { deferreds: Set<Deferred>; settled: boolean }
>();

/**
 * The original `Promise.race` implementation can cause memory leaks when used with long running
 * promises (see [1]). This function is a re-implementation of `Promise.race` that does not suffer
 * from this drawback. It is an adaption of Brian Kim's [1] version including the improvement by
 * Dan Bornstein [2].
 *
 * [1]: https://github.com/nodejs/node/issues/17469#issuecomment-685216777
 * [2]: https://github.com/danfuzz/lactoserv/pull/173
 *
 */
export default async function safePromiseRace<T extends readonly PromiseLike<unknown>[]>(
  contenders: T,
): Promise<Awaited<T[number]>> {
  let deferred: Deferred | undefined;
  const result = new Promise((resolve, reject) => {
    deferred = { resolve, reject };

    for (const contender of contenders) {
      const record = deferredsByPromise.get(contender);
      if (record == undefined) {
        addRaceContender(contender, deferred);
      } else if (record.settled) {
        // If the value has settled, it is safe to call
        // `Promise.resolve(contender).then` on it.
        Promise.resolve(contender).then(resolve, reject);
      } else {
        record.deferreds.add(deferred);
      }
    }
  });

  // The finally callback executes when any value settles, preventing any of
  // the unresolved values from retaining a reference to the resolved value.
  return await ((await result.finally(() => {
    for (const contender of contenders) {
      const record = deferredsByPromise.get(contender);
      if (record) {
        record.deferreds.delete(deferred!);
      }
    }
  })) as Promise<Awaited<T[number]>>);
}

function addRaceContender(contender: PromiseLike<unknown>, deferred: Deferred): void {
  const record = { deferreds: new Set([deferred]), settled: false };
  deferredsByPromise.set(contender, record);
  // This call to `then` happens once for the lifetime of the value.
  Promise.resolve(contender).then(
    (value) => {
      for (const { resolve } of record.deferreds) {
        resolve(value);
      }

      record.deferreds.clear();
      record.settled = true;
    },
    (err) => {
      for (const { reject } of record.deferreds) {
        reject(err);
      }

      record.deferreds.clear();
      record.settled = true;
    },
  );
}
