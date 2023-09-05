/** @jest-environment jsdom */
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { renderHook } from "@testing-library/react-hooks";

import { TopicListItem, UseTopicListSearchParams, useTopicListSearch } from "./useTopicListSearch";

function itemToString(topicListItem: TopicListItem): string {
  switch (topicListItem.type) {
    case "topic":
      return topicListItem.item.item.name;
    case "schema":
      return topicListItem.item.item.fullPath;
  }
}

describe("useTopicListSearch", () => {
  it("sorts topics with matches above matching paths", () => {
    const topics: UseTopicListSearchParams["topics"] = [
      { name: "abc", schemaName: "ABC" },
      { name: "xyz", schemaName: "XYZ" },
    ];
    const datatypes: UseTopicListSearchParams["datatypes"] = new Map([
      ["ABC", { definitions: [{ name: "xyz", type: "string" }] }],
      ["XYZ", { definitions: [{ name: "abc", type: "string" }] }],
    ]);
    const { result } = renderHook(() =>
      useTopicListSearch({ topics, datatypes, filterText: "xyz" }),
    );
    expect(result.current.map(itemToString)).toEqual(["xyz", "abc", "abc.xyz"]);
  });
});
