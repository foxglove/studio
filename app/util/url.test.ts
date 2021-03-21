// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { parseInputUrl } from "@foxglove-studio/app/util/url";

describe("util/url", () => {
  describe("parseInputUrl", () => {
    it("accepts undefined, empty, and malformed input", () => {
      expect(parseInputUrl()).toBeUndefined();
      expect(parseInputUrl("")).toBeUndefined();
      expect(parseInputUrl("://")).toBeUndefined();
      expect(parseInputUrl("://test:100")).toBeUndefined();
    });

    it("accepts fully formed URL input", () => {
      expect(String(parseInputUrl("http://server.com:11311/"))).toEqual("http://server.com:11311/");
      expect(String(parseInputUrl("https://server.com:11311/"))).toEqual(
        "https://server.com:11311/",
      );
    });

    it("accepts shorthand URL inputs", () => {
      expect(String(parseInputUrl("http://localhost:11311"))).toEqual("http://localhost:11311/");
      expect(String(parseInputUrl("http://localhost"))).toEqual("http://localhost/");
      expect(String(parseInputUrl("https://localhost"))).toEqual("https://localhost/");
      expect(String(parseInputUrl("localhost:11311"))).toEqual("http://localhost:11311/");
      expect(String(parseInputUrl("localhost"))).toEqual("http://localhost/");
    });
  });
});
