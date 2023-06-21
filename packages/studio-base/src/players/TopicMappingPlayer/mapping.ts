// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { groupBy, transform, uniq } from "lodash";
import memoizeWeak from "memoize-weak";

import { Immutable as Im, MessageEvent, TopicMapper } from "@foxglove/studio";
import { GlobalVariables } from "@foxglove/studio-base/hooks/useGlobalVariables";
import {
  MessageBlock,
  PlayerProblem,
  PlayerState,
  Progress,
  SubscribePayload,
  Topic,
  TopicStats,
} from "@foxglove/studio-base/players/types";

type TopicMapping = Map<string, string[]>;
type MessageBlocks = readonly (undefined | MessageBlock)[];
const EmptyMapping: Im<TopicMapping> = new Map();

export type TopicMappers = Array<{ extensionId: string; mapper: TopicMapper }>;

export type MappingInputs = {
  mappers: TopicMappers;
  topics: undefined | Topic[];
  variables: GlobalVariables;
};

function mapBlocks(blocks: MessageBlocks, mapping: Im<TopicMapping>): MessageBlocks {
  if (mapping === EmptyMapping) {
    return blocks;
  }

  return blocks.map((block) => {
    if (block == undefined) {
      return undefined;
    }

    return {
      ...block,
      messagesByTopic: transform(
        block.messagesByTopic,
        (acc, messages, topic) => {
          const mappings = mapping.get(topic);
          if (mappings) {
            for (const mappedTopic of mappings) {
              acc[mappedTopic] = messages.map((msg) => ({
                ...msg,
                topic: mappedTopic,
              }));
            }
          }
          acc[topic] = messages;
        },
        {} as Record<string, MessageEvent<unknown>[]>,
      ),
    };
  });
}

function mapMessages(messages: Im<MessageEvent[]>, mapping: Im<TopicMapping>): Im<MessageEvent[]> {
  if (mapping === EmptyMapping) {
    return messages;
  }

  const mappedMessages: MessageEvent[] = [];

  for (const msg of messages) {
    mappedMessages.push(msg);
    const mappings = mapping.get(msg.topic);
    if (mappings) {
      for (const topic of mappings) {
        mappedMessages.push({ ...msg, topic });
      }
    }
  }

  return mappedMessages;
}

function mapPublishedTopics(
  topics: Map<string, Set<string>>,
  mapping: Im<TopicMapping>,
): Map<string, Set<string>> {
  if (mapping === EmptyMapping) {
    return topics;
  }

  const mappedTopics = new Map<string, Set<string>>();
  for (const [key, values] of topics) {
    const mappedValues = [...values].flatMap((value) => mapping.get(value) ?? value);
    mappedTopics.set(key, new Set([...values, ...mappedValues]));
  }
  return mappedTopics;
}

function mapSubscribedTopics(
  topics: Map<string, Set<string>>,
  mapping: Im<TopicMapping>,
  subcriptions: Im<SubscribePayload[]>,
): Map<string, Set<string>> {
  if (mapping === EmptyMapping) {
    return topics;
  }

  const subscriptionsByTopic = groupBy(subcriptions, (sub) => sub.topic);
  const mappedTopics = new Map<string, Set<string>>();
  for (const [id, values] of topics) {
    const mappedValues = [...values].flatMap((value) => {
      // If we have a subscription to the unmapped topic, include that, otherwise include
      // the mapped topics.
      const mapped = mapping.get(value);
      if (subscriptionsByTopic[value]) {
        return [value, ...(mapped ?? [])];
      } else if (mapped) {
        return mapped;
      } else {
        return value;
      }
    });
    mappedTopics.set(id, new Set(mappedValues));
  }
  return mappedTopics;
}

function mapProgress(progress: Progress, mapping: Im<TopicMapping>): Progress {
  if (mapping === EmptyMapping || progress.messageCache == undefined) {
    return progress;
  }
  const newProgress: Progress = {
    ...progress,
    messageCache: {
      ...progress.messageCache,
      blocks: memos.mapBlocks(progress.messageCache.blocks, mapping),
    },
  };
  return newProgress;
}

function mapTopics(topics: Topic[], mapping: Im<TopicMapping>): Topic[] {
  if (mapping === EmptyMapping) {
    return topics;
  }

  return topics.flatMap((topic) => {
    const mappings = mapping.get(topic.name);
    if (mappings) {
      return [
        topic,
        ...mappings.map((name) => ({
          ...topic,
          name,
          mappedFromName: topic.name,
        })),
      ];
    } else {
      return topic;
    }
  });
}

function mapTopicStats(
  stats: Map<string, TopicStats>,
  mapping: Im<TopicMapping>,
): Map<string, TopicStats> {
  if (mapping === EmptyMapping) {
    return stats;
  }

  const mappedStats: Map<string, TopicStats> = new Map();

  for (const [topic, stat] of stats) {
    mappedStats.set(topic, stat);
    const mappings = mapping.get(topic);
    if (mappings) {
      for (const mappedTopic of mappings) {
        mappedStats.set(mappedTopic, stat);
      }
    }
  }

  return mappedStats;
}

// Inverts a mapping, used to reverse map incoming subscriptions to subscriptions we pass
// through to the wrapped player.
function invertMapping(mapping: Im<TopicMapping>): Im<TopicMapping> {
  if (mapping === EmptyMapping) {
    return EmptyMapping;
  }

  const inverted: TopicMapping = new Map();
  for (const [key, values] of mapping.entries()) {
    for (const value of values) {
      const newValues = inverted.get(value) ?? [];
      newValues.push(key);
      inverted.set(value, newValues);
    }
  }
  return inverted;
}

// Merges multiple mappings into a single unified mapping. Note that a single topic name
// can map to more than one renamed topic if multiple extensions provide a mapping for it.
// Also returns any problems caused by disallowed mappings.
function mergeMappings(
  maps: Im<{ extensionId: string; map: Map<string, string> }[]>,
  inputs: Im<MappingInputs>,
): {
  mapping: TopicMapping;
  problems: undefined | PlayerProblem[];
} {
  const inverseMapping = new Map<string, string>();
  const problems: PlayerProblem[] = [];
  const merged: TopicMapping = new Map();
  const topics = inputs.topics ?? [];
  for (const { extensionId, map } of maps) {
    for (const [key, value] of map.entries()) {
      const existingMapping = inverseMapping.get(value);
      if (topics.some((topic) => topic.name === value)) {
        problems.push({
          severity: "error",
          message: `Disallowed topic mapping`,
          tip: `Extension ${extensionId} mapped topic ${key} is already present in the data source.`,
        });
      } else if (existingMapping != undefined && existingMapping !== key) {
        problems.push({
          severity: "error",
          message: `Disallowed topic mapping`,
          tip: `Extension ${extensionId} requested duplicate mapping from topic ${key} to topic ${value}.`,
        });
      } else {
        inverseMapping.set(value, key);
        const mergedValues = uniq(merged.get(key) ?? []).concat(value);
        merged.set(key, mergedValues);
      }
    }
  }
  return { mapping: merged, problems: problems.length > 0 ? problems : undefined };
}

// Applies our topic mappers to the input topics to generate an active set of name =>
// renamed topic mappings.
function buildMapping(inputs: Im<MappingInputs>): {
  mapping: Im<TopicMapping>;
  problems: undefined | PlayerProblem[];
} {
  const mappings = inputs.mappers.map((mapper) => ({
    extensionId: mapper.extensionId,
    map: mapper.mapper({
      topics: inputs.topics ?? [],
      globalVariables: inputs.variables,
    }),
  }));
  const anyMappings = mappings.some((map) => [...map.map.entries()].length > 0);
  return anyMappings
    ? mergeMappings(mappings, inputs)
    : { mapping: EmptyMapping, problems: undefined };
}

// Memoize our mapping functions to avoid redundant work and also to preserve downstream
// referential transparency for React components.
const memos = {
  buildMapping: memoizeWeak(buildMapping),
  mapBlocks: memoizeWeak(mapBlocks),
  mapMessages: memoizeWeak(mapMessages),
  mapProgress: memoizeWeak(mapProgress),
  mapPublishedTopics: memoizeWeak(mapPublishedTopics),
  mapSubscribedTopics: memoizeWeak(mapSubscribedTopics),
  mapTopics: memoizeWeak(mapTopics),
  mapTopicStats: memoizeWeak(mapTopicStats),
};

/**
 * Maps a player state to a new player state with all topic name mappings applied.
 *
 * @param inputs the mapping inputs to the mapping function
 * @param playerState the player state containing topics to map
 * @returns a mapped player state with all mapped topic names replaced with their mapped
 * value.
 */
export function mapPlayerState(
  inputs: Im<MappingInputs>,
  subscriptions: Im<SubscribePayload[]>,
  playerState: PlayerState,
): PlayerState {
  const newState = {
    ...playerState,
    activeData: playerState.activeData ? { ...playerState.activeData } : undefined,
  };

  const { mapping, problems } = memos.buildMapping(inputs);

  if (newState.activeData) {
    newState.activeData.topics = memos.mapTopics(newState.activeData.topics, mapping);
    newState.activeData.messages = memos.mapMessages(newState.activeData.messages, mapping);
    if (newState.activeData.publishedTopics) {
      newState.activeData.publishedTopics = memos.mapPublishedTopics(
        newState.activeData.publishedTopics,
        mapping,
      );
    }
    if (newState.activeData.subscribedTopics) {
      newState.activeData.subscribedTopics = memos.mapSubscribedTopics(
        newState.activeData.subscribedTopics,
        mapping,
        subscriptions,
      );
    }

    newState.activeData.topicStats = memos.mapTopicStats(newState.activeData.topicStats, mapping);
  }

  if (newState.progress.messageCache) {
    newState.progress = memos.mapProgress(newState.progress, mapping);
  }

  if (problems != undefined) {
    newState.problems = (newState.problems ?? []).concat(problems);
  }

  return newState;
}

/**
 * Maps an array of subscriptions to a new array with all topic mappings applied.
 *
 * @param inputs the inputs to the mapping function
 * @param subscriptions the subscription payloads to map
 * @returns a new array of subscription payloads with mapped topic names
 */
export const mapSubscriptions = memoizeWeak(
  (inputs: Im<MappingInputs>, subcriptions: SubscribePayload[]): SubscribePayload[] => {
    const { mapping } = memos.buildMapping(inputs);

    if (mapping === EmptyMapping) {
      return subcriptions;
    }

    const inverseMapping = invertMapping(mapping);

    return subcriptions.flatMap((sub) => {
      const mappings = inverseMapping.get(sub.topic);
      if (mappings) {
        return mappings.map((topic) => ({
          ...sub,
          topic,
        }));
      } else {
        return sub;
      }
    });
  },
);
