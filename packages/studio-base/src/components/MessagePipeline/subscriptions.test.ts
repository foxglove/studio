// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { simplifySubscriptionsById } from "@foxglove/studio-base/components/MessagePipeline/subscriptions";
import { SubscribePayload } from "@foxglove/studio-base/players/types";

describe("simplifySubscriptionsById", () => {
  it("combines subscriptions", () => {
    const subs: Map<string, SubscribePayload[]> = new Map([
      ["0", [{ type: "whole", topic: "a", preloadType: "full" }]],
      ["1", [{ type: "whole", topic: "a", preloadType: "partial" }]],
      ["2", [{ type: "slice", topic: "a", preloadType: "partial", fields: ["one", "two"] }]],

      ["3", [{ type: "slice", topic: "b", preloadType: "full", fields: ["one", "two"] }]],
      ["4", [{ type: "slice", topic: "b", preloadType: "partial", fields: ["one"] }]],
      [
        "5",
        [{ type: "slice", topic: "b", preloadType: "partial", fields: ["one", "two", "three"] }],
      ],
      ["6", [{ type: "slice", topic: "c", preloadType: "partial", fields: [] }]],
    ]);

    const result = simplifySubscriptionsById(subs);

    expect(result).toEqual(
      expect.arrayContaining([
        { type: "whole", topic: "a", preloadType: "full" },
        { type: "whole", topic: "a", preloadType: "partial" },

        { type: "slice", topic: "b", preloadType: "full", fields: ["one", "two"] },
        { type: "slice", topic: "b", preloadType: "partial", fields: ["one", "two", "three"] },
      ]),
    );
  });
});
