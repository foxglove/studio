// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { fromRFC3339String, toRFC3339String, Time } from "@foxglove/rostime";
import { LayoutID } from "@foxglove/studio-base/index";
import { PlayerURLState } from "@foxglove/studio-base/players/types";
import { assertNever } from "@foxglove/studio-base/util/assertNever";
import isDesktopApp from "@foxglove/studio-base/util/isDesktopApp";

export type AppURLState = PlayerURLState & {
  layoutId: LayoutID | undefined;
  time: Time | undefined;
};

/**
 * Encodes app state in a URL's query params.
 *
 * @param url The base URL to encode params into.
 * @param layoutId Optinal layout ID to store in the URL.
 * @param urlState The player state to encode.
 * @returns A url with all app state stored as query pararms.
 */
export function encodeAppURLState(url: URL, urlState: AppURLState): URL {
  // Clear all exisiting params first.
  [...url.searchParams].forEach(([k, _]) => url.searchParams.delete(k));

  if (urlState.layoutId) {
    url.searchParams.set("layoutId", urlState.layoutId);
  }

  if (urlState.type === "ros1-remote-bagfile") {
    // We can't get full paths to local files so only set this for remote files.
    if (urlState.url.startsWith("http")) {
      url.searchParams.set("type", urlState.type);
      url.searchParams.set("url", urlState.url);
    }
  } else if (
    urlState.type === "ros1" ||
    urlState.type === "ros2" ||
    urlState.type === "rosbridge-websocket"
  ) {
    url.searchParams.set("type", urlState.type);
    url.searchParams.set("url", urlState.url);
  } else if (urlState.type === "foxglove-data-platform") {
    url.searchParams.set("type", urlState.type);
    Object.entries(urlState.options).forEach(([k, v]) => {
      url.searchParams.set(k, v);
    });
  } else {
    assertNever(urlState, "Unknown url state.");
  }

  if (urlState.time != undefined) {
    url.searchParams.set("time", toRFC3339String(urlState.time));
  }

  url.searchParams.sort();

  return url;
}

/**
 * Tries to parse a state url into one of the types we know how to open.
 *
 * @param url URL to try to parse.
 * @returns Parsed URL type or undefined if the url is not a foxglove URL.
 * @throws Error if URL parsing fails.
 */
export function parseAppURLState(url: URL): AppURLState | undefined {
  const type = url.searchParams.get("type");
  if (!type) {
    return undefined;
  }

  if (isDesktopApp() && url.protocol !== "foxglove:") {
    throw Error("Unknown protocol.");
  }

  if (!isDesktopApp() && url.pathname !== "/") {
    throw Error("Unknown path.");
  }

  const layoutId = url.searchParams.get("layoutId");
  const timeString = url.searchParams.get("time");
  const time = timeString == undefined ? undefined : fromRFC3339String(timeString);

  if (
    type === "ros1-remote-bagfile" ||
    type === "rosbridge-websocket" ||
    type === "ros1" ||
    type === "ros2"
  ) {
    const resourceUrl = url.searchParams.get("url");
    if (!resourceUrl) {
      throw Error(`Missing resource url param in ${url}`);
    } else {
      return {
        layoutId: layoutId ? (layoutId as LayoutID) : undefined,
        time,
        type,
        url: resourceUrl,
      };
    }
  } else if (type === "foxglove-data-platform") {
    const start = url.searchParams.get("start") ?? "";
    const end = url.searchParams.get("end") ?? "";
    const seek = url.searchParams.get("seekTo") ?? undefined;
    const deviceId = url.searchParams.get("deviceId");
    if (!deviceId) {
      throw Error(`Missing deviceId param in ${url}`);
    }

    if (
      !fromRFC3339String(start) ||
      !fromRFC3339String(end) ||
      (seek && !fromRFC3339String(seek))
    ) {
      throw Error(`Missing or invalid timestamp(s) in ${url}`);
    }
    return {
      layoutId: layoutId ? (layoutId as LayoutID) : undefined,
      time,
      type: "foxglove-data-platform",
      options: {
        start,
        end,
        seek,
        deviceId,
      },
    };
  } else {
    throw Error(`Unknown deep link type ${url}`);
  }
}

/**
 * Tries to parse app url state from the window's current location.
 */
export function windowAppURLState(): AppURLState | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    return parseAppURLState(new URL(window.location.href));
  } catch {
    return undefined;
  }
}

/**
 * Checks to see if we have a valid state encoded in the url.
 *
 * @returns True if the window has a valid encoded url state.
 */
export function windowHasValidURLState(): boolean {
  const urlState = windowAppURLState();
  return urlState != undefined;
}
