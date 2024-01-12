// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import parseRosPath from "./parseRosPath";
import { stringifyRosPath } from "./stringifyRosPath";

describe("stringifyRosPath", () => {
  const paths = [
    "/some0/nice_topic.with[99].stuff[0]",
    "/some0/nice_topic.with[99].stuff[0].@derivative",
    "some0/nice_topic.with[99].stuff[0]",
    "some_nice_topic",
    String.raw`"/foo/bar".baz`,
    String.raw`"\"".baz`,
    "/topic.foo[0].bar",
    "/topic.foo[1:3].bar",
    "/topic.foo[1:].bar",
    "/topic.foo[:10].bar",
    "/topic.foo[:].bar",
    "/topic.foo[$a].bar",
    "/topic.foo[$a:$b].bar",
    "/topic.foo[$a:5].bar",
    "/topic.foo[$a:].bar",
    "/topic.foo{bar=='baz'}.a{bar==\"baz\"}.b{bar==3}.c{bar==-1}.d{bar==false}.e[:]{bar.baz==true}",
    "/topic{foo=='bar'}{baz==2}.a[3].b{x=='y'}",
    "/topic.foo{bar==$}.a{bar==$my_var_1}",
  ];
  it.each(paths)("stringify: %s", (str) => {
    expect(stringifyRosPath(parseRosPath(str)!)).toEqual(str);
  });
});
