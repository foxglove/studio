// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

export type NamespacedTopic = string & { __type: "namespaced_topic" };

/**
 * Creates a namespaced topic out of a topic out of a combination of a topic + schema.
 */
export function namespaceTopic(topic: string, schema: string): NamespacedTopic {
  return `${encodeURIComponent(topic)}:${encodeURIComponent(schema)}` as NamespacedTopic;
}

/**
 * Extract the plain topic name from a namespaced topic. Ideally we wouldn't have to do
 * this but this would require more extensive changes to renderables that currently assume
 * their "topic" is something that can be directly displayed to the user.
 */
export function unnamespacetopic(topic: NamespacedTopic): string {
  const encodedTopic = topic.split(":")[0] ?? "";
  return decodeURIComponent(encodedTopic);
}
