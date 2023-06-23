// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import safePromiseRace from "@foxglove/studio-base/util/safePromiseRace";

async function waitAndReturn<T>(ms: number, retVal: T): Promise<T> {
  return await new Promise((resolve) => {
    setTimeout(() => resolve(retVal), ms);
  });
}

describe("save promise race", () => {
  it("lets single promise win", async () => {
    await expect(safePromiseRace([Promise.resolve(1)])).resolves.toEqual(1);
  });

  it("lets first resolved promise win", async () => {
    await expect(
      safePromiseRace([Promise.resolve("foo"), Promise.resolve("bar")]),
    ).resolves.toEqual("foo");
  });

  it("lets faster resolving promise win", async () => {
    await expect(
      safePromiseRace([
        waitAndReturn(750, "foo"),
        waitAndReturn(750, 123),
        waitAndReturn(500, "bar"),
      ]),
    ).resolves.toEqual("bar");
  });

  it("lets resolving promise win", async () => {
    const nonResolvingPromise = new Promise(() => {});

    await expect(
      safePromiseRace([waitAndReturn(1000, "foo"), nonResolvingPromise]),
    ).resolves.toEqual("foo");
  });

  it("lets faster resolving promise win on the second race", async () => {
    const longerRunningPromise = waitAndReturn(1000, "long");

    await expect(
      safePromiseRace([waitAndReturn(750, "foo"), longerRunningPromise]),
    ).resolves.toEqual("foo");

    await expect(
      safePromiseRace([waitAndReturn(750, "bar"), longerRunningPromise]),
    ).resolves.toEqual("long");
  });
});
