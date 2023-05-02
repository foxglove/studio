/** @jest-environment jsdom */
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { renderHook } from "@testing-library/react-hooks";

import { useTimestampUserFirstSeen, useUserFirstSeenTimestamp } from "./useStampUserFirstSeenTime";

describe("useTimestampUserFirstSeen", () => {
  it("stamps the first session time", () => {
    const setItem = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => undefined);
    const getItem = jest.spyOn(Storage.prototype, "getItem");

    renderHook(() => useTimestampUserFirstSeen());

    expect(getItem).toHaveBeenCalled();
    expect(setItem).toHaveBeenCalledWith("fox.studio.user-first-seen", expect.any(String));
    expect(setItem).toHaveBeenCalledWith("fox.studio.user-first-seen.is-first-session", "true");
  });

  it("checks for an existing workspace key", () => {
    const setItem = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => undefined);
    const getItem = jest.spyOn(Storage.prototype, "getItem").mockImplementation((key: string) => {
      if (key === "fox.studio.user-first-seen") {
        return ReactNull;
      } else {
        return "present";
      }
    });

    renderHook(() => useTimestampUserFirstSeen());

    expect(getItem).toHaveBeenCalled();
    expect(setItem).toHaveBeenCalledWith("fox.studio.user-first-seen", expect.any(String));
    expect(setItem).toHaveBeenCalledWith("fox.studio.user-first-seen.is-first-session", "false");
  });
});

describe("useUserFirstSeenTimestamp", () => {
  it("returns the stamp", () => {
    const { result } = renderHook(() => useUserFirstSeenTimestamp());
    expect(result.current).toEqual({
      firstSeen: expect.any(Date),
      firstSeenIsFirstSession: expect.any(Boolean),
    });
  });
});
