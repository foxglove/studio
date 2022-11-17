import { Topic } from "@foxglove/studio";

export function topicHasSupportedSchema(topic: Topic, schemaNames: Set<string>) {
  return (
    schemaNames.has(topic.schemaName) ||
    (topic.additionalSchemaNames?.some((name) => schemaNames.has(name)) ?? false)
  );
}
