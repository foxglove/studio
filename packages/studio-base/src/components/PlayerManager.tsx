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

import { set as idbSet, get as idbGet, createStore as idbCreateStore } from "idb-keyval";
import {
  PropsWithChildren,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useToasts } from "react-toast-notifications";
import { useAsync, useLocalStorage } from "react-use";
import { v4 as uuid } from "uuid";

import { useShallowMemo } from "@foxglove/hooks";
import Logger from "@foxglove/log";
import { AppSetting } from "@foxglove/studio-base/AppSetting";
import { MessagePipelineProvider } from "@foxglove/studio-base/components/MessagePipeline";
import { useAnalytics } from "@foxglove/studio-base/context/AnalyticsContext";
import ConsoleApiContext from "@foxglove/studio-base/context/ConsoleApiContext";
import { useCurrentLayoutSelector } from "@foxglove/studio-base/context/CurrentLayoutContext";
import PlayerSelectionContext, {
  IDataSourceFactory,
  PlayerSelection,
} from "@foxglove/studio-base/context/PlayerSelectionContext";
import { useUserNodeState } from "@foxglove/studio-base/context/UserNodeStateContext";
import { useAppConfigurationValue } from "@foxglove/studio-base/hooks/useAppConfigurationValue";
import { GlobalVariables } from "@foxglove/studio-base/hooks/useGlobalVariables";
import { usePrompt } from "@foxglove/studio-base/hooks/usePrompt";
import useWarnImmediateReRender from "@foxglove/studio-base/hooks/useWarnImmediateReRender";
import AnalyticsMetricsCollector from "@foxglove/studio-base/players/AnalyticsMetricsCollector";
import OrderedStampPlayer from "@foxglove/studio-base/players/OrderedStampPlayer";
import UserNodePlayer from "@foxglove/studio-base/players/UserNodePlayer";
import { Player } from "@foxglove/studio-base/players/types";
import { UserNodes } from "@foxglove/studio-base/types/panels";
import Storage from "@foxglove/studio-base/util/Storage";

const log = Logger.getLogger(__filename);

const DEFAULT_MESSAGE_ORDER = "receiveTime";
const EMPTY_USER_NODES: UserNodes = Object.freeze({});
const EMPTY_GLOBAL_VARIABLES: GlobalVariables = Object.freeze({});

type PlayerManagerProps = {
  playerSources: IDataSourceFactory[];
};

type RecentRecord = {
  id: string;
  sourceId: string;
  displayName: string;
  args?: Record<string, unknown>;
};

const customStore = idbCreateStore("foxglove-recents", "custom-store-name");

export default function PlayerManager(props: PropsWithChildren<PlayerManagerProps>): JSX.Element {
  const { children, playerSources } = props;

  useWarnImmediateReRender();

  const { setUserNodeDiagnostics, addUserNodeLogs, setUserNodeRosLib } = useUserNodeState();
  const userNodeActions = useShallowMemo({
    setUserNodeDiagnostics,
    addUserNodeLogs,
    setUserNodeRosLib,
  });

  const prompt = usePrompt();

  // When we implement per-data-connector UI settings we will move this into the ROS 1 Socket data
  // connector. As a workaround, we read this from our app settings and provide this to
  // initialization args for all connectors.
  const [rosHostname] = useAppConfigurationValue<string>(AppSetting.ROS1_ROS_HOSTNAME);

  const analytics = useAnalytics();
  const metricsCollector = useMemo(() => new AnalyticsMetricsCollector(analytics), [analytics]);

  // When we implmenent per-data-connector UI settings we will move this into the appropriate
  // data sources. We might also consider this a studio responsibility and handle generically for
  // all data sources.
  const [unlimitedMemoryCache = false] = useAppConfigurationValue<boolean>(
    AppSetting.UNLIMITED_MEMORY_CACHE,
  );

  // When we implement per-data-connector UI settings we will move this into the foxglove data platform source.
  const consoleApi = useContext(ConsoleApiContext);

  const messageOrder = useCurrentLayoutSelector(
    (state) => state.selectedLayout?.data?.playbackConfig.messageOrder,
  );
  const userNodes = useCurrentLayoutSelector((state) => state.selectedLayout?.data?.userNodes);
  const globalVariables = useCurrentLayoutSelector(
    (state) => state.selectedLayout?.data?.globalVariables ?? EMPTY_GLOBAL_VARIABLES,
  );

  const globalVariablesRef = useRef<GlobalVariables>(globalVariables);
  const [basePlayer, setBasePlayer] = useState<Player | undefined>();

  // We don't want to recreate the player when the message order changes, but we do want to
  // initialize it with the right order, so make a variable for its initial value we can use in the
  // dependency array below to defeat the linter.
  const [initialMessageOrder] = useState(messageOrder);

  const player = useMemo<OrderedStampPlayer | undefined>(() => {
    if (!basePlayer) {
      return undefined;
    }

    const userNodePlayer = new UserNodePlayer(basePlayer, userNodeActions);
    const headerStampPlayer = new OrderedStampPlayer(
      userNodePlayer,
      initialMessageOrder ?? DEFAULT_MESSAGE_ORDER,
    );
    headerStampPlayer.setGlobalVariables(globalVariablesRef.current);
    return headerStampPlayer;
  }, [basePlayer, initialMessageOrder, userNodeActions]);

  useLayoutEffect(() => {
    player?.setMessageOrder(messageOrder ?? DEFAULT_MESSAGE_ORDER);
  }, [player, messageOrder]);
  useLayoutEffect(() => {
    void player?.setUserNodes(userNodes ?? EMPTY_USER_NODES);
  }, [player, userNodes]);

  const { addToast } = useToasts();
  const [_saveSource, _setSavedSource, removeSavedSource] = useLocalStorage<unknown>(
    "studio.playermanager.selected-source.v2",
  );

  const [selectedSource, setSelectedSource] = useState<IDataSourceFactory | undefined>();

  const { value: savedRecents } = useAsync(async () => {
    const untypedRecents = await idbGet("recents", customStore);
    return untypedRecents as RecentRecord[];
  }, []);

  const [recents, setRecents] = useState<RecentRecord[]>([]);

  useLayoutEffect(() => {
    if (!savedRecents) {
      return;
    }
    setRecents(savedRecents);
  }, [savedRecents]);

  const saveRecents = useCallback((recentRecords: RecentRecord[]) => {
    idbSet("recents", recentRecords, customStore).catch((err) => {
      console.error(err);
    });
  }, []);

  // Add a new recent entry
  const addRecent = useCallback(
    (record: Omit<RecentRecord, "id">) => {
      const newRecord: RecentRecord = {
        id: uuid(),
        ...record,
      };

      setRecents((prevRecents) => {
        // To keep only the latest 5 recent items, we remove any items index 4+
        prevRecents.splice(4, 100);
        prevRecents.unshift(newRecord);

        saveRecents(prevRecents);
        return [...prevRecents];
      });
    },
    [saveRecents],
  );

  // Select a recent entry by id
  const selectRecent = useCallback(
    (recentId: string) => {
      // find the recent from the list and initialize
      const foundRecent = recents.find((value) => value.id === recentId);
      if (!foundRecent) {
        addToast(`Failed to restore recent: ${recentId}`, {
          appearance: "error",
        });
        return;
      }

      const sourceId = foundRecent.sourceId;
      const foundSource = playerSources.find((source) => source.id === sourceId);
      if (!foundSource) {
        addToast(`Unknown data source: ${sourceId}`, {
          appearance: "error",
        });
        return;
      }

      metricsCollector.setProperty("player", sourceId);
      setSelectedSource(() => foundSource);

      try {
        const initArgs = {
          metricsCollector,
          unlimitedMemoryCache,
          ...foundRecent.args,
        };

        const newPlayer = foundSource.initialize(initArgs);
        setBasePlayer(newPlayer);

        setRecents((prevRecents) => {
          const recentIdx = recents.findIndex((value) => value.id === recentId);
          if (recentIdx < 0) {
            return prevRecents;
          }
          prevRecents.splice(recentIdx, 1);
          prevRecents.unshift(foundRecent);

          saveRecents(prevRecents);
          return [...prevRecents];
        });
      } catch (err) {
        addToast((err as Error).message, { appearance: "error" });
      }
    },
    [recents, playerSources, metricsCollector, addToast, unlimitedMemoryCache, saveRecents],
  );

  // Make a RecentSources array for the PlayerSelectionContext
  const recentSources = useMemo(() => {
    return recents.map((item) => {
      return { id: item.id, displayName: item.displayName };
    });
  }, [recents]);

  const selectSource = useCallback(
    async (sourceId: string, args?: Record<string, unknown>) => {
      log.debug(`Select Source: ${sourceId}`);

      // empty string sourceId
      if (!sourceId) {
        return;
      }

      const foundSource = playerSources.find((source) => source.id === sourceId);
      if (!foundSource) {
        addToast(`Unknown data source: ${sourceId}`, {
          appearance: "warning",
        });
        return;
      }

      metricsCollector.setProperty("player", sourceId);
      setSelectedSource(() => foundSource);

      if (foundSource.promptOptions) {
        let argUrl: string | undefined;
        if (typeof args?.url === "string") {
          argUrl = args?.url;
        }

        // Load the previous prompt value
        const previousPromptCacheKey = `${foundSource.id}.previousPromptValue`;
        const previousPromptValue = new Storage().getItem<string>(previousPromptCacheKey);

        const promptOptions = foundSource.promptOptions(argUrl ?? previousPromptValue);
        try {
          // If the arg url is specified we don't need to prompt
          const url = argUrl ?? (await prompt(promptOptions));
          if (!url) {
            return;
          }

          const allArgs = {
            ...args,
            rosHostname,
            url,
          };

          new Storage().setItem(previousPromptCacheKey, url);
          const newPlayer = foundSource.initialize({ url, metricsCollector, unlimitedMemoryCache });
          setBasePlayer(newPlayer);

          if (newPlayer?.displayName) {
            addRecent({
              sourceId,
              displayName: newPlayer.displayName,
              args: allArgs,
            });
          }
        } catch (error) {
          addToast((error as Error).message, { appearance: "error" });
        }

        return;
      }

      if (foundSource.supportsOpenDirectory === true) {
        try {
          const folder = await showDirectoryPicker();
          const allArgs = {
            ...args,
            folder,
          };

          const newPlayer = foundSource.initialize({
            folder,
            metricsCollector,
            unlimitedMemoryCache,
          });
          setBasePlayer(newPlayer);

          if (newPlayer?.displayName) {
            addRecent({
              sourceId,
              displayName: newPlayer.displayName,
              args: allArgs,
            });
          }
        } catch (error) {
          if (error.name === "AbortError") {
            return undefined;
          }
          addToast((error as Error).message, { appearance: "error" });
        }

        return;
      }

      const supportedFileTypes = foundSource.supportedFileTypes;
      if (supportedFileTypes != undefined) {
        try {
          let file = (args?.files as File[] | undefined)?.[0];

          if (!file) {
            const [fileHandle] = await showOpenFilePicker({
              types: [
                {
                  description: foundSource.displayName,
                  accept: { "application/octet-stream": supportedFileTypes },
                },
              ],
            });
            file = await fileHandle.getFile();
          }

          const allArgs = {
            ...args,
            file,
          };

          const newPlayer = foundSource.initialize({
            file,
            metricsCollector,
            unlimitedMemoryCache,
          });

          setBasePlayer(newPlayer);

          if (newPlayer?.displayName) {
            addRecent({
              sourceId,
              displayName: newPlayer.displayName,
              args: allArgs,
            });
          }
        } catch (error) {
          if (error.name === "AbortError") {
            return;
          }
          addToast((error as Error).message, { appearance: "error" });
        }

        return;
      }

      try {
        const newPlayer = foundSource.initialize({
          ...args,
          consoleApi,
          metricsCollector,
          unlimitedMemoryCache,
        });
        setBasePlayer(newPlayer);
      } catch (error) {
        addToast((error as Error).message, { appearance: "error" });
      }

      return;
    },
    [
      addRecent,
      addToast,
      consoleApi,
      metricsCollector,
      playerSources,
      prompt,
      rosHostname,
      unlimitedMemoryCache,
    ],
  );

  // Prior to storing recents in indexeddb we stored some selected source state in localstorage.
  // This effect clears the localstorage values to tidy up. We should remove it after some time
  // 2021/12/07
  useLayoutEffect(() => {
    removeSavedSource();
  }, [removeSavedSource]);

  const value: PlayerSelection = {
    selectSource,
    selectRecent,
    selectedSource,
    availableSources: playerSources,
    recentSources,
  };

  return (
    <>
      <PlayerSelectionContext.Provider value={value}>
        <MessagePipelineProvider player={player} globalVariables={globalVariables}>
          {children}
        </MessagePipelineProvider>
      </PlayerSelectionContext.Provider>
    </>
  );
}
