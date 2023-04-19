// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

/**
 * Determines the namespaced settings key for a topic + schema. This is used to
 * prevent potential clashes in the config under /topics caused by message
 * converters.
 */
export function settingsTopicKey(topic: string, schema: undefined | string): string {
  return schema ? `${topic}_::_${schema}` : topic;
}
