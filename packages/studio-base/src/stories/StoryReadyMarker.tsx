// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { screen, within } from "@testing-library/react";

function storyReadyMarkerText(count: number): string {
  return Array(count).fill("🤖").join("");
}

/**
 * Waits for the story reader marker to appear, with an expected count of `count`.
 *
 * @param count expected count passed to the StoryReadyMarker component
 * @param options element to query within, or `screen` if unspecified
 */
export async function waitForStoryReadyMarker(
  count: number,
  options?: { element?: HTMLElement },
): Promise<void> {
  const target = options?.element ? within(options.element) : screen;
  await target.findByText(storyReadyMarkerText(count), { selector: "caption" }, { timeout: 5000 });
}

/**
 * Used to provide easily searched for text for testing-library findByX queries.
 */
export function StoryReadyMarker(props: { count: number }): JSX.Element {
  return (
    <caption style={{ position: "absolute", left: "1em", top: "1em", fontSize: "2em" }}>
      {storyReadyMarkerText(props.count)}
    </caption>
  );
}
