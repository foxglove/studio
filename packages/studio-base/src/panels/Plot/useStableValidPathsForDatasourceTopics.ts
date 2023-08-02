// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { createSelector } from "reselect";

import { filterMap } from "@foxglove/den/collection";
import { useShallowMemo } from "@foxglove/hooks";
import parseRosPath from "@foxglove/studio-base/components/MessagePathSyntax/parseRosPath";
import {
  MessagePipelineContext,
  useMessagePipeline,
} from "@foxglove/studio-base/components/MessagePipeline";

export const selectKeyedTopics = createSelector(
  (ctx: MessagePipelineContext) => ctx.sortedTopics,
  (topics) => new Set(topics.map((topic) => topic.name)),
);

/**
 * Returns a list of paths that parse as a valid path and reference a topic that exists in
 * datasource.
 */
export function useStableValidPathsForDatasourceTopics(
  paths: readonly string[],
): readonly string[] {
  const keyedTopics = useMessagePipeline(selectKeyedTopics);

  const stableValidPaths = useShallowMemo(
    filterMap(paths, (path) => {
      const parsedTopic = parseRosPath(path)?.topicName;
      const pathIsBareTopic = path === parsedTopic;
      return !pathIsBareTopic && parsedTopic && keyedTopics.has(parsedTopic) ? path : undefined;
    }),
  );

  return stableValidPaths;
}
