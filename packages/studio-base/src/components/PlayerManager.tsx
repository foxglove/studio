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

import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useToasts } from "react-toast-notifications";
import { useLocalStorage } from "react-use";

import { useShallowMemo } from "@foxglove/hooks";
import Logger from "@foxglove/log";
import { MessagePipelineProvider } from "@foxglove/studio-base/components/MessagePipeline";
import { useCurrentLayoutSelector } from "@foxglove/studio-base/context/CurrentLayoutContext";
import PlayerSelectionContext, {
  DataSource,
  PlayerSelection,
} from "@foxglove/studio-base/context/PlayerSelectionContext";
import { useUserNodeState } from "@foxglove/studio-base/context/UserNodeStateContext";
import { GlobalVariables } from "@foxglove/studio-base/hooks/useGlobalVariables";
import { usePrompt } from "@foxglove/studio-base/hooks/usePrompt";
import useWarnImmediateReRender from "@foxglove/studio-base/hooks/useWarnImmediateReRender";
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
  playerSources: DataSource[];
};

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

  useEffect(() => {
    player?.setMessageOrder(messageOrder ?? DEFAULT_MESSAGE_ORDER);
  }, [player, messageOrder]);
  useEffect(() => {
    player?.setUserNodes(userNodes ?? EMPTY_USER_NODES);
  }, [player, userNodes]);

  const { addToast } = useToasts();
  const [savedSource, setSavedSource, removeSavedSource] = useLocalStorage<{
    id: string;
    args?: Record<string, unknown>;
  }>("studio.playermanager.selected-source.v2");

  const [selectedSource, setSelectedSource] = useState<DataSource | undefined>();

  const selectSource = useCallback(
    async (sourceId: string, args?: Record<string, unknown>) => {
      log.debug(`Select Source: ${sourceId}`);

      if (!sourceId) {
        removeSavedSource();
        setSelectedSource(undefined);
        return;
      }

      removeSavedSource();

      const foundSource = playerSources.find((source) => source.id === sourceId);
      if (!foundSource) {
        addToast(`Unknown data source: ${sourceId}`, {
          appearance: "warning",
        });
        return;
      }

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
          const url = await prompt(promptOptions);
          if (!url) {
            return;
          }

          new Storage().setItem(previousPromptCacheKey, url);

          // only url based sources are saved as the selected source
          setSavedSource({
            id: sourceId,
            args: {
              ...args,
              url,
            },
          });

          const newPlayer = foundSource.initialize({ url });
          setBasePlayer(newPlayer);
        } catch (error) {
          // no-op
        }
      }

      if (foundSource.supportsOpenDirectory === true) {
        try {
          const folder = await showDirectoryPicker();
          const newPlayer = foundSource.initialize({ folder });
          setBasePlayer(newPlayer);
        } catch (error) {
          if (error.name === "AbortError") {
            return undefined;
          }
          throw error;
        }

        return;
      }

      const supportedFileTypes = foundSource.supportedFileTypes;
      if (supportedFileTypes == undefined) {
        return;
      }

      try {
        const [fileHandle] = await showOpenFilePicker({
          types: [
            {
              description: foundSource.displayName,
              accept: { "application/octet-stream": supportedFileTypes },
            },
          ],
        });
        const file = await fileHandle.getFile();

        const newPlayer = foundSource.initialize({ file });
        setBasePlayer(newPlayer);
      } catch (error) {
        if (error.name === "AbortError") {
          return;
        }
        throw error;
      }

      return;
    },
    [addToast, playerSources, prompt, removeSavedSource, setSavedSource],
  );

  // restore the saved source on first mount
  useLayoutEffect(() => {
    if (savedSource) {
      const foundSource = playerSources.find((source) => source.id === savedSource.id);
      if (!foundSource) {
        return;
      }

      const initializedBasePlayer = foundSource.initialize(savedSource.args);
      setBasePlayer(initializedBasePlayer);
    }
    // we only run the layout effect on first mount - never again even if the saved source changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: PlayerSelection = {
    selectSource,
    selectedSource,
    availableSources: playerSources,
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
