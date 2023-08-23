// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
//
// This file incorporates work covered by the following copyright and
// permission notice:
//
//   Copyright 2018-2021 Cruise LLC
//
//   This source code is licensed under the Apache License, Version 2.0,
//   found at http://www.apache.org/licenses/LICENSE-2.0
//   You may not use this file except in compliance with the License.

import { produce } from "immer";
import { set } from "lodash";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";

import { filterMap } from "@foxglove/den/collection";
import { useShallowMemo } from "@foxglove/hooks";
import {
  Immutable,
  PanelExtensionContext,
  SettingsTreeAction,
  Subscription,
  Topic,
} from "@foxglove/studio";
import Stack from "@foxglove/studio-base/components/Stack";
import ThemeProvider from "@foxglove/studio-base/theme/ThemeProvider";
import concatAndTruncate from "@foxglove/studio-base/util/concatAndTruncate";

import { Filter, FilterBar } from "./FilterBar";
import LogList from "./LogList";
import { normalizedLogMessage } from "./conversion";
import { filterMessages } from "./filterMessages";
import { buildSettingsTree } from "./settings";
import { Config, LogMessageEvent, NormalizedLogMessage } from "./types";

type Props = {
  context: PanelExtensionContext;
};

const EMPTY_ARRAY: Immutable<Topic[]> = [];

export function isSupportedSchema(schemaName: string): boolean {
  switch (schemaName) {
    case "foxglove_msgs/Log":
    case "foxglove_msgs/msg/Log":
    case "foxglove.Log":
    case "foxglove::Log":
    case "rcl_interfaces/msg/Log":
    case "ros.rcl_interfaces.Log":
    case "ros.rosgraph_msgs.Log":
    case "rosgraph_msgs/Log":
      return true;
    default:
      return false;
  }
}

/**
 * Filter a list of Topics to those that are eligible for subscription either because their
 * schemaName is supported or they can be converted to a supported schema.
 */
const computeElegibletopics = (topics: Immutable<Topic[]>) => {
  return filterMap(topics, (topic) => {
    if (isSupportedSchema(topic.schemaName)) {
      return topic;
    }

    if (topic.convertibleTo) {
      for (const schemaName of topic.convertibleTo) {
        if (isSupportedSchema(schemaName)) {
          return { name: topic.name, schemaName };
        }
      }
    }
    return undefined;
  });
};

function LogPanel(props: Props): JSX.Element {
  const { context } = props;

  const [renderDone, setRenderDone] = useState<() => void>(() => () => {});
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [config, setConfig] = useState<Immutable<Config>>(context.initialState as Config);
  const [allTopics, setAllTopics] = useState<Immutable<Topic[]>>([]);
  const [allMessages, setAllMessages] = useState<Immutable<NormalizedLogMessage[]>>([]);
  const [seenNodeNames, setSeenNodeNames] = useState<Immutable<Set<string>>>(new Set());

  useLayoutEffect(() => {
    context.watch("currentFrame");
    context.watch("topics");
    context.watch("didSeek");
    context.watch("colorScheme");

    context.onRender = (renderState, done) => {
      setIsDarkTheme(renderState.colorScheme === "dark");
      setRenderDone(() => done);
      setAllTopics(renderState.topics ?? EMPTY_ARRAY);

      if (renderState.didSeek === true) {
        setAllMessages([]);
      }

      if (renderState.currentFrame) {
        const logMessages = renderState.currentFrame as Immutable<LogMessageEvent[]>;
        const normalized = logMessages.map((msgEvent) =>
          normalizedLogMessage(msgEvent.schemaName, msgEvent.message),
        );

        setSeenNodeNames((oldSeenNames) => {
          const newSeenNames = new Set<string>();

          for (const message of normalized) {
            const name = message.name;
            if (name != undefined && !oldSeenNames.has(name)) {
              newSeenNames.add(name);
            }
          }
          if (newSeenNames.size === 0) {
            return oldSeenNames;
          }
          return new Set([...oldSeenNames, ...newSeenNames]);
        });

        setAllMessages((oldMessages) => {
          return concatAndTruncate(oldMessages, normalized, 100_000);
        });
      }
    };
  }, [context]);

  const settingsTreeActionHandler = useCallback((action: Immutable<SettingsTreeAction>) => {
    if (action.action !== "update") {
      return;
    }

    const { path, value } = action.payload;
    if (path[0] === "general" && path[1] === "topicToRender") {
      setConfig(produce<Immutable<Config>>((draft) => set(draft, "topicToRender", value)));
    }
  }, []);

  const eligibleTopics = useMemo(() => computeElegibletopics(allTopics), [allTopics]);

  const firstEligible = eligibleTopics[0];
  if (config.topicToRender == undefined && firstEligible != undefined) {
    setConfig((oldConfig) => ({
      ...oldConfig,
      topicToRender: firstEligible.name,
    }));
  }

  const { topicToRender } = config;

  useEffect(() => {
    context.setDefaultPanelTitle(topicToRender);
  }, [context, topicToRender]);

  // Memo the subscription topic separate from eligibleTopics so we don't re-subscribe when eligible topics changes
  // but our subscriptionTopic has not
  const subscriptionTopic = useMemo(() => {
    return eligibleTopics.find((topic) => topic.name === topicToRender);
  }, [eligibleTopics, topicToRender]);

  useEffect(() => {
    setAllMessages([]);

    if (subscriptionTopic?.name == undefined) {
      context.subscribe([] as Subscription[]);
      return;
    }

    context.subscribe([{ topic: subscriptionTopic.name, convertTo: subscriptionTopic.schemaName }]);
  }, [context, subscriptionTopic?.name, subscriptionTopic?.schemaName]);

  // Use a shallow memo of the eligible topic names to avoid rebuilding the settings tree when the entire topics list changes
  // but the eligible list of topics is unchanged
  const eligibleTopicNames = useShallowMemo(
    useMemo(() => eligibleTopics.map((topic) => topic.name), [eligibleTopics]),
  );
  useEffect(() => {
    context.updatePanelSettingsEditor({
      actionHandler: settingsTreeActionHandler,
      nodes: buildSettingsTree(topicToRender, eligibleTopicNames),
    });
  }, [context, settingsTreeActionHandler, eligibleTopicNames, topicToRender]);

  const setFilter = useCallback((filter: Filter) => {
    setConfig({
      minLogLevel: filter.minLogLevel,
      searchTerms: filter.searchTerms,
    });
  }, []);

  const searchTermsSet = useMemo(() => new Set(config.searchTerms), [config.searchTerms]);

  const { minLogLevel, searchTerms } = config;
  const filteredMessages = useMemo(
    () => filterMessages(allMessages, { minLogLevel, searchTerms }),
    [allMessages, minLogLevel, searchTerms],
  );

  // Indicate we finished the latest render after react finishes this render
  useEffect(() => {
    renderDone();
  }, [renderDone]);

  return (
    <ThemeProvider isDark={isDarkTheme}>
      <Stack fullHeight>
        <Stack fullHeight flexGrow={1}>
          <LogList items={filteredMessages} />
        </Stack>
        <FilterBar
          searchTerms={searchTermsSet}
          minLogLevel={minLogLevel}
          nodeNames={seenNodeNames}
          messages={filteredMessages}
          onFilterChange={setFilter}
        />
      </Stack>
    </ThemeProvider>
  );
}

export { LogPanel };
