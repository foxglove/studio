// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { BiMap } from "./BiMap";

describe("BiMap", () => {
  it("get/set", () => {
    const map = new BiMap<number, string>();
    expect(map.get(1)).toBeUndefined();
    expect(map.getByValue("a")).toBeUndefined();

    map.set(1, "a");
    expect(map.get(1)).toEqual("a");
    expect(map.getByValue("a")).toEqual(1);
  });

  it("delete", () => {
    const map = new BiMap<number, string>();
    map.set(1, "a");
    expect(map.get(1)).toEqual("a");
    map.delete(1);
    expect(map.get(1)).toBeUndefined();
    expect(map.getByValue("a")).toBeUndefined();

    map.set(1, "a");
    expect(map.get(1)).toEqual("a");
    expect(map.getByValue("a")).toEqual(1);
    map.deleteByValue("a");
    expect(map.get(1)).toBeUndefined();
    expect(map.getByValue("a")).toBeUndefined();
  });

  it("clear", () => {
    const map = new BiMap<number, string>();
    map.set(1, "a");
    map.set(2, "b");
    map.clear();
    expect(map.get(1)).toBeUndefined();
    expect(map.get(2)).toBeUndefined();
    expect(map.getByValue("a")).toBeUndefined();
    expect(map.getByValue("b")).toBeUndefined();
  });

  it("should overwrite existing values", () => {
    const map = new BiMap<number, string>();
    map.set(1, "a");
    map.set(1, "b");
    expect(map.get(1)).toEqual("b");
    expect(map.getByValue("a")).toBeUndefined();
    expect(map.getByValue("b")).toEqual(1);
  });

  it("should always maintain 1:1 key/value mapping", () => {
    const map = new BiMap<number, string>();
    map.set(1, "a");
    map.set(2, "a");
    expect(map.get(1)).toBeUndefined();
    expect(map.get(2)).toEqual("a");
    expect(map.getByValue("a")).toEqual(2);

    map.set(1, "b");
    expect(map.get(1)).toEqual("b");
    expect(map.get(2)).toEqual("a");
    expect(map.getByValue("a")).toEqual(2);
    expect(map.getByValue("b")).toEqual(1);

    map.set(2, "b");
    expect(map.get(1)).toBeUndefined();
    expect(map.get(2)).toEqual("b");
    expect(map.getByValue("a")).toBeUndefined();
    expect(map.getByValue("b")).toEqual(2);
  });
});
