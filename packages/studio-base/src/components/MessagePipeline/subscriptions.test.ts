// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { simplifySubscriptionsById } from "@foxglove/studio-base/components/MessagePipeline/subscriptions";
import { SubscribePayload } from "@foxglove/studio-base/players/types";

describe("simplifySubscriptionsById", () => {
  it("combines full and partial subscriptions", () => {
    const subs: Map<string, SubscribePayload[]> = new Map([
      ["0", [{ topic: "a", preloadType: "full" }]],
      ["1", [{ topic: "a", preloadType: "partial" }]],
    ]);

    const result = simplifySubscriptionsById(subs);

    expect(result).toEqual(
      expect.arrayContaining([
        { topic: "a", preloadType: "full" },
        { topic: "a", preloadType: "partial" },
      ]),
    );
  });

  it("combines full and partial and sliced subscriptions", () => {
    const subs: Map<string, SubscribePayload[]> = new Map([
      ["0", [{ topic: "a", preloadType: "full" }]],
      ["1", [{ topic: "a", preloadType: "partial" }]],
      ["2", [{ topic: "a", preloadType: "partial", fields: ["one", "two"] }]],
    ]);

    const result = simplifySubscriptionsById(subs);

    expect(result).toEqual(
      expect.arrayContaining([
        { topic: "a", preloadType: "full" },
        { topic: "a", preloadType: "partial" },
      ]),
    );
  });

  it("excludes empty slices", () => {
    const subs: Map<string, SubscribePayload[]> = new Map([
      ["5", [{ topic: "b", preloadType: "full", fields: ["one", "two"] }]],
      ["6", [{ topic: "b", preloadType: "partial", fields: ["one", "two", "three"] }]],
      ["7", [{ topic: "c", preloadType: "partial", fields: [] }]],
    ]);

    const result = simplifySubscriptionsById(subs);

    expect(result).toEqual(
      expect.arrayContaining([
        { topic: "b", preloadType: "full", fields: ["one", "two"] },
        { topic: "b", preloadType: "partial", fields: ["one", "two", "three"] },
      ]),
    );
  });
});
