// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { initRenderStateBuilder } from "./renderState";

describe("renderState", () => {
  it("should include additionalSchemaNames when there are message converters", () => {
    const buildRenderState = initRenderStateBuilder();
    const state = buildRenderState({
      watchedFields: new Set(["topics"]),
      playerState: undefined,
      appSettings: undefined,
      currentFrame: undefined,
      colorScheme: undefined,
      globalVariables: {},
      hoverValue: undefined,
      sortedTopics: [{ name: "test", schemaName: "schema" }],
      subscriptions: [],
      messageConverters: [
        {
          fromSchemaName: "schema",
          toSchemaName: "more",
          converter: () => {},
        },
      ],
    });

    expect(state).toEqual({
      topics: [
        { name: "test", schemaName: "schema", datatype: "schema", additionalSchemaNames: ["more"] },
      ],
    });
  });

  it("should avoid conversion if the topic schema is already the desired convertTo schema", () => {
    const buildRenderState = initRenderStateBuilder();
    const state = buildRenderState({
      watchedFields: new Set(["topics", "currentFrame"]),
      playerState: undefined,
      appSettings: undefined,
      currentFrame: [
        {
          topic: "test",
          schemaName: "schema",
          receiveTime: { sec: 0, nsec: 0 },
          sizeInBytes: 0,
          message: {},
        },
      ],
      colorScheme: undefined,
      globalVariables: {},
      hoverValue: undefined,
      sortedTopics: [{ name: "test", schemaName: "schema" }],
      subscriptions: [{ topic: "test", convertTo: "schema" }],
      messageConverters: [],
    });

    expect(state).toEqual({
      topics: [{ name: "test", schemaName: "schema", datatype: "schema" }],
      currentFrame: [
        {
          topic: "test",
          schemaName: "schema",
          message: {},
          receiveTime: { sec: 0, nsec: 0 },
          sizeInBytes: 0,
        },
      ],
    });
  });
});
