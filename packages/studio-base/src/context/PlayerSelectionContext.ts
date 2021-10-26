// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { createContext, useContext } from "react";

import { PromptOptions } from "@foxglove/studio-base/hooks/usePrompt";
import { Player, PlayerMetricsCollectorInterface } from "@foxglove/studio-base/players/types";
import ConsoleApi from "@foxglove/studio-base/services/ConsoleApi";

export type PlayerFactoryInitializeArgs = {
  metricsCollector: PlayerMetricsCollectorInterface;
  unlimitedMemoryCache: boolean;
  rosHostname?: string;
  folder?: FileSystemDirectoryHandle;
  file?: File;
  url?: string;
  consoleApi?: ConsoleApi;
} & Record<string, unknown>;

export interface IPlayerFactory {
  id: string;
  displayName: string;
  iconName?: RegisteredIconNames;
  disabledReason?: string | JSX.Element;
  badgeText?: string;
  hidden?: boolean;

  // If data source initialization supports "Open File" workflow, this property lists the supported
  // file types
  supportedFileTypes?: string[];

  supportsOpenDirectory?: boolean;

  promptOptions?: (previousValue?: string) => PromptOptions;

  // Initialize a player.
  initialize: (args: PlayerFactoryInitializeArgs) => Player | undefined;
}

export type SourceSelection = {
  id: string;
  args?: unknown;
};

/**
 * PlayerSelectionContext exposes the available data sources and a function to set the current data source
 */
export interface PlayerSelection {
  selectSource: (sourceId: string, args?: Record<string, unknown>) => void;

  /** Currently selected data source */
  selectedSource?: IPlayerFactory;

  /** List of available data sources */
  availableSources: IPlayerFactory[];
}

const PlayerSelectionContext = createContext<PlayerSelection>({
  selectSource: () => {},
  availableSources: [],
});

export function usePlayerSelection(): PlayerSelection {
  return useContext(PlayerSelectionContext);
}

export default PlayerSelectionContext;
