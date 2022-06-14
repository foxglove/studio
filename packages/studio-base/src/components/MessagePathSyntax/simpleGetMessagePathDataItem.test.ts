// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { MessageEvent } from "@foxglove/studio";

import parseRosPath from "./parseRosPath";
import { simpleGetMessagePathDataItem } from "./simpleGetMessagePathDataItem";

describe("simpleGetMessagePathDataItem", () => {
  it("returns root message if topic matches", () => {
    const message: MessageEvent<unknown> = {
      topic: "/foo",
      receiveTime: { sec: 0, nsec: 0 },
      sizeInBytes: 0,
      message: { foo: 42 },
    };
    expect(simpleGetMessagePathDataItem(message, parseRosPath("/foo")!)).toEqual({ foo: 42 });
    expect(simpleGetMessagePathDataItem(message, parseRosPath("/bar")!)).toBeUndefined();
  });

  it("returns correct nested values", () => {
    const message: MessageEvent<unknown> = {
      topic: "/foo",
      receiveTime: { sec: 0, nsec: 0 },
      sizeInBytes: 0,
      message: {
        foo: {
          bars: [
            { id: 1, name: "bar1" },
            { id: 1, name: "bar1-2" },
            { id: 2, name: "bar2" },
          ],
        },
      },
    };

    expect(simpleGetMessagePathDataItem(message, parseRosPath("/foo.foo.bars[:]{id==2}")!)).toEqual(
      { id: 2, name: "bar2" },
    );
    expect(
      simpleGetMessagePathDataItem(message, parseRosPath("/foo.foo.bars[:]{id==2}.name")!),
    ).toEqual("bar2");
  });

  it("returns undefined for missing fields", () => {
    const message: MessageEvent<unknown> = {
      topic: "/foo",
      receiveTime: { sec: 0, nsec: 0 },
      sizeInBytes: 0,
      message: { foo: 1 },
    };
    expect(
      simpleGetMessagePathDataItem(message, parseRosPath("/foo.foo.baz.hello")!),
    ).toBeUndefined();
  });

  it("throws for unsupported paths and results", () => {
    const message: MessageEvent<unknown> = {
      topic: "/foo",
      receiveTime: { sec: 0, nsec: 0 },
      sizeInBytes: 0,
      message: {
        foo: {
          bars: [
            { id: 1, name: "bar1" },
            { id: 1, name: "bar1-2" },
            { id: 2, name: "bar2" },
          ],
        },
      },
    };
    expect(() =>
      simpleGetMessagePathDataItem(message, parseRosPath("/foo.foo.bars[:]{id==1}")!),
    ).toThrow("Multi-valued results are not supported");

    expect(() =>
      simpleGetMessagePathDataItem(message, parseRosPath("/foo.foo.bars[:]{id==$id}")!),
    ).toThrow("filterMatches only works on paths where global variables have been filled in");
  });
});
