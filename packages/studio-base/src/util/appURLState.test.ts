// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Time, toRFC3339String } from "@foxglove/rostime";
import { LayoutID } from "@foxglove/studio-base/index";
import { PlayerURLState } from "@foxglove/studio-base/players/types";
import { encodeAppURLState, parseAppURLState } from "@foxglove/studio-base/util/appURLState";
import isDesktopApp from "@foxglove/studio-base/util/isDesktopApp";

jest.mock("@foxglove/studio-base/util/isDesktopApp", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockIsDesktop = isDesktopApp as jest.MockedFunction<typeof isDesktopApp>;

describe("app state url parser", () => {
  // Note that the foxglove URL here is different from actual foxglove URLs because Node's URL parser
  // interprets foxglove:// URLs differently than the browser does.
  describe.each([
    { isDesktop: true, urlBuilder: () => new URL("foxglove://host/open") },
    { isDesktop: false, urlBuilder: () => new URL("https://studio.foxglove.dev/") },
  ])("url tests", ({ isDesktop, urlBuilder }) => {
    beforeEach(() => mockIsDesktop.mockReturnValue(isDesktop));
    it("rejects non data state urls", () => {
      expect(parseAppURLState(urlBuilder())).toBeUndefined();
    });

    it("parses rosbag data state urls", () => {
      const url = urlBuilder();
      url.searchParams.append("type", "ros1-remote-bagfile");
      url.searchParams.append("url", "http://example.com");

      expect(parseAppURLState(url)).toMatchObject({
        type: "ros1-remote-bagfile",
        url: "http://example.com",
      });
    });

    it("rejects incomplete state urls", () => {
      const url = urlBuilder();
      url.searchParams.append("type", "foxglove-data-platform");
      url.searchParams.append("start", toRFC3339String({ sec: new Date().getTime(), nsec: 0 }));

      expect(() => parseAppURLState(url)).toThrow(Error);
    });

    it("parses data platform state urls", () => {
      const now: Time = { sec: new Date().getTime(), nsec: 0 };
      const url = urlBuilder();
      url.searchParams.append("type", "foxglove-data-platform");
      url.searchParams.append("start", toRFC3339String(now));
      url.searchParams.append("time", toRFC3339String({ sec: now.sec + 500, nsec: 0 }));
      url.searchParams.append("end", toRFC3339String({ sec: now.sec + 1000, nsec: 0 }));
      url.searchParams.append("deviceId", "dummy");
      url.searchParams.append("layoutId", "1234");

      const parsed = parseAppURLState(url);
      expect(parsed).toMatchObject({
        layoutId: "1234",
        time: { sec: now.sec + 500, nsec: 0 },
        type: "foxglove-data-platform",
      });
    });
  });
});

describe("app state encoding", () => {
  const baseURL = () => new URL("http://example.com");

  it("encodes rosbag urls", () => {
    expect(
      encodeAppURLState(baseURL(), {
        layoutId: "123" as LayoutID,
        time: undefined,
        type: "ros1-remote-bagfile",
        url: "http://foxglove.dev/test.bag",
      }).href,
    ).toEqual(
      "http://example.com/?layoutId=123&type=ros1-remote-bagfile&url=http%3A%2F%2Ffoxglove.dev%2Ftest.bag",
    );
  });

  it("encodes url based states", () => {
    const states: PlayerURLState[] = [
      { type: "ros1", url: "http://example.com:11311/test.bag" },
      { type: "ros2", url: "http://example.com:11311/test.bag" },
      { type: "ros1-remote-bagfile", url: "http://example.com/test.bag" },
      { type: "rosbridge-websocket", url: "ws://foxglove.dev:9090/test.bag" },
    ];
    states.forEach((state) => {
      const url = "url" in state ? state.url : "";
      expect(
        encodeAppURLState(baseURL(), { layoutId: "123" as LayoutID, time: undefined, ...state })
          .href,
      ).toEqual(
        `http://example.com/?layoutId=123&type=${state.type}&url=${encodeURIComponent(url)}`,
      );
    });
  });
});
