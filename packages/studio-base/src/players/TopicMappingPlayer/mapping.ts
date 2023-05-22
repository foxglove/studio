// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Immutable as Im } from "immer";
import { transform, uniq } from "lodash";
import memoizeWeak from "memoize-weak";

import { MessageEvent, RegisterTopicMapperArgs } from "@foxglove/studio";
import {
  MessageBlock,
  PlayerState,
  Progress,
  SubscribePayload,
  Topic,
} from "@foxglove/studio-base/players/types";

export type TopicMapping = Map<string, string[]>;
export type MessageBlocks = readonly (undefined | MessageBlock)[];
export const EmptyMapping: Im<TopicMapping> = new Map();

export type MappingInputs = {
  mappers: RegisterTopicMapperArgs[];
  topics: undefined | Topic[];
};

function mapBlocks(blocks: MessageBlocks, mapping: Im<TopicMapping>): MessageBlocks {
  if (mapping === EmptyMapping) {
    return blocks;
  }

  return blocks.map((block) => {
    return block
      ? {
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
              } else {
                acc[topic] = messages;
              }
            },
            {} as Record<string, MessageEvent<unknown>[]>,
          ),
        }
      : undefined;
  });
}

function mapMessages(
  messages: readonly MessageEvent<unknown>[],
  mapping: Im<TopicMapping>,
): readonly MessageEvent<unknown>[] {
  if (mapping === EmptyMapping) {
    return messages;
  }

  return messages.flatMap((msg) => {
    const mappings = mapping.get(msg.topic);
    if (mappings) {
      return mappings.map((topic) => ({
        ...msg,
        topic,
      }));
    } else {
      return msg;
    }
  });
}

function mapKeyedTopics(
  topics: Map<string, Set<string>>,
  mapping: Im<TopicMapping>,
): Map<string, Set<string>> {
  if (mapping === EmptyMapping) {
    return topics;
  }

  const mappedTopics = new Map<string, Set<string>>();
  for (const [key, values] of topics) {
    const mappedValues = [...values].flatMap((value) => mapping.get(value) ?? value);
    mappedTopics.set(key, new Set(mappedValues));
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
      blocks: memoMapBlocks(progress.messageCache.blocks, mapping),
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
      return mappings.map((name) => ({
        ...topic,
        name,
        mappedFromName: topic.name,
      }));
    } else {
      return topic;
    }
  });
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

// Merges multiple mappings into a single unified mappings. Note that a single topic name
// can map to more than one renamed topic if multiple extensions provide a mapping for it.
function mergeMappings(maps: Im<Map<string, string>[]>): TopicMapping {
  const merged: TopicMapping = new Map();
  for (const map of maps) {
    for (const [key, value] of map.entries()) {
      const mergedValues = uniq((merged.get(key) ?? []).concat(value));
      merged.set(key, mergedValues);
    }
  }
  return merged;
}

// Applies our topic mappers to the input topics to generate an active set of name =>
// renamed topic mappings.
function buildMapping(inputs: Im<MappingInputs>): Im<TopicMapping> {
  const mappings = inputs.mappers.map((mapper) => mapper(inputs.topics ?? []));
  const anyMappings = mappings.some((map) => [...map.entries()].length > 0);
  return anyMappings ? mergeMappings(mappings) : EmptyMapping;
}

// Memoize our mapping functions to avoid redundant work and also to preserve downstream
// referential transparency for React components.
const memoBuildMapping = memoizeWeak(buildMapping);
const memoMapBlocks = memoizeWeak(mapBlocks);
const memoMapKeyedTopics = memoizeWeak(mapKeyedTopics);
const memoMapMessages = memoizeWeak(mapMessages);
const memoMapTopics = memoizeWeak(mapTopics);
const memoMapProgress = memoizeWeak(mapProgress);

/**
 * Maps a player state to a new player state with all topic name mappings applied.
 *
 * @param inputs the mapping inputs to the mapping function
 * @param playerState the player state containing topics to map
 * @returns a mapped player state with all mapped topic names replaced with their mapped
 * value.
 */
export function mapPlayerState(inputs: Im<MappingInputs>, playerState: PlayerState): PlayerState {
  const newState = {
    ...playerState,
    activeData: playerState.activeData ? { ...playerState.activeData } : undefined,
  };

  const mapping = memoBuildMapping(inputs);

  if (newState.activeData) {
    newState.activeData.topics = memoMapTopics(newState.activeData.topics, mapping);
    newState.activeData.messages = memoMapMessages(newState.activeData.messages, mapping);
    if (newState.activeData.publishedTopics) {
      newState.activeData.publishedTopics = memoMapKeyedTopics(
        newState.activeData.publishedTopics,
        mapping,
      );
    }
    if (newState.activeData.subscribedTopics) {
      newState.activeData.subscribedTopics = memoMapKeyedTopics(
        newState.activeData.subscribedTopics,
        mapping,
      );
    }
  }

  if (newState.progress.messageCache) {
    newState.progress = memoMapProgress(newState.progress, mapping);
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
    const mapping = memoBuildMapping(inputs);

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
