// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { MessageDefinition } from "@foxglove/message-definition";
import { getMessagePathSearchItems } from "@foxglove/studio-base/components/TopicList/getMessagePathSearchItems";
import { Topic } from "@foxglove/studio-base/players/types";

describe("getMessagePathSearchItems", () => {
  it("returns items with correct paths and types", () => {
    const schemasByName: ReadonlyMap<string, MessageDefinition> = new Map([
      [
        "Foo",
        {
          name: "Foo",
          definitions: [
            { name: "const", type: "float64", isConstant: true, value: 1 },
            { name: "num", type: "float64" },
            { name: "num_array", type: "float64", isArray: true },
            { name: "bar", type: "Bar", isComplex: true },
            { name: "bar_array", type: "Bar", isComplex: true, isArray: true },
          ],
        },
      ],
      [
        "Bar",
        {
          name: "Bar",
          definitions: [
            { name: "const", type: "float64", isConstant: true, value: 1 },
            { name: "str", type: "string" },
            { name: "str_array", type: "string", isArray: true },
          ],
        },
      ],
    ]);
    const topics: Topic[] = [
      { name: "foo1", schemaName: "Foo" },
      { name: "foo2", schemaName: "Foo" },
      { name: "bar", schemaName: "Bar" },
    ];

    expect(getMessagePathSearchItems(topics, schemasByName).items).toEqual([
      {
        rootSchemaName: "Foo",
        pathSuffix: ".num",
        topics: [
          { name: "foo1", schemaName: "Foo" },
          { name: "foo2", schemaName: "Foo" },
        ],
        type: "float64",
      },
      {
        rootSchemaName: "Foo",
        pathSuffix: ".num_array",
        topics: [
          { name: "foo1", schemaName: "Foo" },
          { name: "foo2", schemaName: "Foo" },
        ],
        type: "float64[]",
      },
      {
        rootSchemaName: "Foo",
        pathSuffix: ".bar",
        topics: [
          { name: "foo1", schemaName: "Foo" },
          { name: "foo2", schemaName: "Foo" },
        ],
        type: "Bar",
      },
      {
        rootSchemaName: "Foo",
        pathSuffix: ".bar.str",
        topics: [
          { name: "foo1", schemaName: "Foo" },
          { name: "foo2", schemaName: "Foo" },
        ],
        type: "string",
      },
      {
        rootSchemaName: "Foo",
        pathSuffix: ".bar.str_array",
        topics: [
          { name: "foo1", schemaName: "Foo" },
          { name: "foo2", schemaName: "Foo" },
        ],
        type: "string[]",
      },
      {
        rootSchemaName: "Foo",
        pathSuffix: ".bar_array",
        topics: [
          { name: "foo1", schemaName: "Foo" },
          { name: "foo2", schemaName: "Foo" },
        ],
        type: "Bar[]",
      },
      {
        rootSchemaName: "Foo",
        pathSuffix: ".bar_array[:].str",
        topics: [
          { name: "foo1", schemaName: "Foo" },
          { name: "foo2", schemaName: "Foo" },
        ],
        type: "string",
      },
      {
        rootSchemaName: "Foo",
        pathSuffix: ".bar_array[:].str_array",
        topics: [
          { name: "foo1", schemaName: "Foo" },
          { name: "foo2", schemaName: "Foo" },
        ],
        type: "string[]",
      },
      {
        rootSchemaName: "Bar",
        pathSuffix: ".str",
        topics: [{ name: "bar", schemaName: "Bar" }],
        type: "string",
      },
      {
        rootSchemaName: "Bar",
        pathSuffix: ".str_array",
        topics: [{ name: "bar", schemaName: "Bar" }],
        type: "string[]",
      },
    ]);
  });

  it("supports cyclic types at root and non-root levels", () => {
    const schemasByName: ReadonlyMap<string, MessageDefinition> = new Map([
      [
        "Foo",
        {
          name: "Foo",
          definitions: [
            { name: "self", type: "Foo", isComplex: true },
            { name: "bar", type: "Bar", isComplex: true },
          ],
        },
      ],
      [
        "Bar",
        {
          name: "Bar",
          definitions: [{ name: "foo", type: "Foo", isComplex: true }],
        },
      ],
    ]);

    expect(
      getMessagePathSearchItems([{ name: "foo", schemaName: "Foo" }], schemasByName).items,
    ).toEqual([
      {
        rootSchemaName: "Foo",
        pathSuffix: ".self",
        topics: [{ name: "foo", schemaName: "Foo" }],
        type: "Foo",
      },
      {
        rootSchemaName: "Foo",
        pathSuffix: ".bar",
        topics: [{ name: "foo", schemaName: "Foo" }],
        type: "Bar",
      },
      {
        rootSchemaName: "Foo",
        pathSuffix: ".bar.foo",
        topics: [{ name: "foo", schemaName: "Foo" }],
        type: "Foo",
      },
    ]);

    expect(
      getMessagePathSearchItems([{ name: "bar", schemaName: "Bar" }], schemasByName).items,
    ).toEqual([
      {
        rootSchemaName: "Bar",
        pathSuffix: ".foo",
        topics: [{ name: "bar", schemaName: "Bar" }],
        type: "Foo",
      },
      {
        rootSchemaName: "Bar",
        pathSuffix: ".foo.self",
        topics: [{ name: "bar", schemaName: "Bar" }],
        type: "Foo",
      },
      {
        rootSchemaName: "Bar",
        pathSuffix: ".foo.bar",
        topics: [{ name: "bar", schemaName: "Bar" }],
        type: "Bar",
      },
    ]);
  });
});
