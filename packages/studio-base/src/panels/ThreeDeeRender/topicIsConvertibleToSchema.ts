// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Topic } from "@foxglove/studio";

/**
 * Determines whether `topic` has a supported schema from the set of `supportedSchemaNames`, either
 * as the original schema or one of the `convertibleTo` schemas.
 */
export function topicIsConvertibleToSchema(
  topic: Topic,
  supportedSchemaNames: Set<string>,
): boolean {
  return (
    supportedSchemaNames.has(topic.schemaName) ||
    (topic.convertibleTo?.some((name) => supportedSchemaNames.has(name)) ?? false)
  );
}

/**
 * Finds the most appropriate schema for a topic given a set of supported schemas. Prefers
 * a schema we support directly and falls back to a schema we can convert the topic to.
 *
 * @param topic the topic in question
 * @param supportedSchemaNames schemas that the client supports
 * @returns the best schema for the client to subscribe under
 */
export function convertibleSchemaForTopic(
  topic: Topic,
  supportedSchemaNames: ReadonlySet<string>,
): undefined | string {
  if (supportedSchemaNames.has(topic.schemaName)) {
    return topic.schemaName;
  }

  return topic.convertibleTo?.find((name) => supportedSchemaNames.has(name));
}
