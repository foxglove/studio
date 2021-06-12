// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import LazilyInitialized from "@foxglove/studio-base/services/CachedRemoteLayoutStorage/LazilyInitialized";
import signal from "@foxglove/studio-base/util/signal";

describe("LazilyInitialized", () => {
  it("calls the provided compute function only once", async () => {
    const sig = signal<number>();
    const compute = jest.fn().mockReturnValue(sig);
    const lazy = new LazilyInitialized(compute);
    expect(compute).toHaveBeenCalledTimes(0);

    const promise1 = lazy.get();
    expect(compute).toHaveBeenCalledTimes(1);
    const promise2 = lazy.get();
    expect(compute).toHaveBeenCalledTimes(1);
    await Promise.resolve();
    expect(compute).toHaveBeenCalledTimes(1);

    sig.resolve(1);
    expect(await promise1).toBe(1);
    expect(await promise2).toBe(1);
    expect(compute).toHaveBeenCalledTimes(1);
  });
});
