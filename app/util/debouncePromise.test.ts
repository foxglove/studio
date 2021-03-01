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

import debouncePromise from "./debouncePromise";

describe("debouncePromise", () => {
  it("should debounce consecutive calls", async () => {
    const promises: Promise<void>[] = [];

    let calls = 0;
    const debouncedFn = debouncePromise(() => {
      ++calls;
      const promise = promises.shift();
      if (!promise) {
        throw new Error("No more promises :'(");
      }
      return promise;
    });

    expect(calls).toBe(0);

    promises.push(Promise.resolve());
    debouncedFn();
    debouncedFn();
    expect(calls).toBe(1);

    promises.push(Promise.resolve());

    // wait for first promise to finish
    await debouncedFn.currentPromise;
    expect(calls).toBe(2);

    // wait for second promise to finish
    await debouncedFn.currentPromise;
    expect(debouncedFn.currentPromise).toBeUndefined();
  });

  it("should debounce with resolved and rejected promises", async () => {
    const promises: Promise<void>[] = [];

    let calls = 0;
    const debouncedFn = debouncePromise(() => {
      ++calls;
      const promise = promises.shift();
      if (!promise) {
        throw new Error("No more promises :'(");
      }
      return promise;
    });

    expect(calls).toBe(0);

    promises.push(Promise.resolve());
    debouncedFn();
    debouncedFn();
    expect(calls).toBe(1);

    promises.push(Promise.reject(new Error("lazy panda")));

    // wait for first promise to finish
    await debouncedFn.currentPromise;
    expect(calls).toBe(2);

    // wait for second promise to fully complete and throw its error
    await expect(debouncedFn.currentPromise).rejects.toThrow(new Error("lazy panda"));
    expect(debouncedFn.currentPromise).toBeUndefined();
  });

  it("handles nested calls", async () => {
    expect.assertions(3);

    let calls = 0;
    const debouncedFn = debouncePromise(async () => {
      ++calls;
      if (calls === 1) {
        debouncedFn();
        expect(calls).toBe(1);
      }
    });

    debouncedFn();
    expect(calls).toBe(1);

    await debouncedFn.currentPromise;
    expect(calls).toBe(2);
  });
});
