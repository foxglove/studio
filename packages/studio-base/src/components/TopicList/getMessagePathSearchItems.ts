// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { groupBy } from "lodash";

import { MessageDefinition } from "@foxglove/message-definition";
import { Immutable } from "@foxglove/studio";
import { quoteFieldNameIfNeeded } from "@foxglove/studio-base/components/MessagePathSyntax/parseRosPath";
import { Topic } from "@foxglove/studio-base/src/players/types";

export type MessagePathSearchItem = Immutable<{
  topics: Topic[];
  rootSchemaName: string;
  pathSuffix: string;
  type: string;
}>;

/**
 * @param topics Passed through as {@link MessagePathSearchItem.topics}
 * @param rootSchemaName Passed through as {@link MessagePathSearchItem.rootSchemaName}
 * @param prefix Prepended to each item's {@link MessagePathSearchItem.pathSuffix}
 * @param seenSchemaNames List of schema names that have been visited
 */
function* generateMessagePathSearchItemsForSchema(
  topics: Topic[],
  rootSchemaName: string,
  schema: Immutable<MessageDefinition>,
  schemasByName: Immutable<Map<string, MessageDefinition>>,
  prefix: string,
  seenSchemaNames: readonly string[],
): Iterable<MessagePathSearchItem> {
  for (const { name, isArray, isConstant, isComplex, type } of schema.definitions) {
    if (isConstant === true) {
      continue;
    }

    const pathSuffix = `${prefix}.${quoteFieldNameIfNeeded(name)}`;
    yield {
      rootSchemaName,
      topics,
      pathSuffix,
      type: isArray === true ? `${type}[]` : type,
    };

    if (isComplex === true) {
      if (rootSchemaName === type || seenSchemaNames.includes(type)) {
        continue;
      }
      const fieldSchema = schemasByName.get(type);
      if (!fieldSchema || fieldSchema.name == undefined) {
        continue;
      }
      yield* generateMessagePathSearchItemsForSchema(
        topics,
        rootSchemaName,
        fieldSchema,
        schemasByName,
        isArray === true ? `${pathSuffix}[:]` : pathSuffix,
        [...seenSchemaNames, type],
      );
    }
  }
}

export function getMessagePathSearchItems(
  allTopics: readonly Topic[],
  schemasByName: Immutable<Map<string, MessageDefinition>>,
): {
  items: MessagePathSearchItem[];
  itemsBySchemaName: Map<string, MessagePathSearchItem[]>;
} {
  const items: MessagePathSearchItem[] = [];
  const itemsBySchemaName = new Map<string, MessagePathSearchItem[]>();
  const topicsBySchemaName = groupBy(
    allTopics.filter((topic) => topic.schemaName != undefined),
    (topic) => topic.schemaName,
  );
  for (const [schemaName, topics] of Object.entries(topicsBySchemaName)) {
    const schema = schemasByName.get(schemaName);
    if (!schema) {
      continue;
    }
    for (const searchItem of generateMessagePathSearchItemsForSchema(
      topics,
      schemaName,
      schema,
      schemasByName,
      "",
      [],
    )) {
      items.push(searchItem);
    }
  }
  return { items, itemsBySchemaName };
}
