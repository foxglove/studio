// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Immutable, SettingsTreeNodes } from "@foxglove/studio";

export function buildSettingsTree(
  topicToRender: string | undefined,
  availableTopics: Immutable<string[]>,
): SettingsTreeNodes {
  const topicOptions = availableTopics.map((topic) => ({ label: topic, value: topic }));
  const topicIsAvailable = availableTopics.some((topic) => topic === topicToRender);
  if (!topicIsAvailable && topicToRender) {
    topicOptions.unshift({ value: topicToRender, label: topicToRender });
  }
  const topicError = topicIsAvailable ? undefined : `Topic ${topicToRender} is not available.`;

  return {
    general: {
      fields: {
        topicToRender: {
          input: "select",
          label: "Topic",
          value: topicToRender,
          error: topicError,
          options: topicOptions,
        },
      },
    },
  };
}
