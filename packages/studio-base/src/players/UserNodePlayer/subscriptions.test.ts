// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { SubscribePayload } from "@foxglove/studio-base/players/types";

import { simplifySubscriptions } from "./subscriptions";

describe("simplifySubscriptions", () => {
  const call = (
    subscriptions: SubscribePayload[],
    inputsByOutputTopic: Record<string, readonly string[]>,
  ) => simplifySubscriptions(subscriptions, new Map(Object.entries(inputsByOutputTopic)));

  it("ignores unrelated subscriptions", () => {
    expect(
      call(
        [
          {
            topic: "/test",
          },
        ],
        {},
      ),
    ).toEqual([
      {
        "/test": {
          topic: "/test",
          preloadType: "partial",
        },
      },
      [
        {
          topic: "/test",
        },
      ],
    ]);
  });

  it("ignores virtual topics without inputs", () => {
    expect(
      call(
        [
          {
            topic: "/test",
          },
        ],
        {
          "/test": [],
        },
      ),
    ).toEqual([{}, []]);
  });

  it("upgrades to a full subscription from partial", () => {
    expect(
      call(
        [
          {
            topic: "/test",
            preloadType: "full",
          },
          {
            topic: "/test",
            preloadType: "partial",
          },
        ],
        {
          "/test": ["/test2"],
        },
      ),
    ).toEqual([
      {
        "/test": {
          topic: "/test",
          preloadType: "full",
        },
      },
      [
        {
          topic: "/test2",
          preloadType: "full",
        },
        {
          topic: "/test2",
          preloadType: "partial",
        },
      ],
    ]);
  });

  it("upgrades to a full subscription from fields", () => {
    expect(
      call(
        [
          {
            topic: "/test",
            fields: ["one", "two"],
          },
        ],
        {
          "/test": ["/test2"],
        },
      ),
    ).toEqual([
      {
        "/test": {
          topic: "/test",
          preloadType: "partial",
        },
      },
      [
        {
          topic: "/test2",
          preloadType: "partial",
        },
      ],
    ]);
  });

  it("upgrades to a full subscription from fields even when user also subscribes to input", () => {
    expect(
      call(
        [
          {
            topic: "/test",
            fields: ["one", "two"],
          },
          {
            topic: "/test2",
            fields: ["one", "two"],
          },
        ],
        {
          "/test": ["/test2"],
        },
      ),
    ).toEqual([
      {
        "/test": {
          topic: "/test",
          preloadType: "partial",
        },
        "/test2": {
          topic: "/test2",
          preloadType: "partial",
        },
      },
      [
        {
          topic: "/test2",
          preloadType: "partial",
        },
      ],
    ]);
  });
});
