// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { createContext, FunctionComponent, useContext } from "react";

import { Player } from "@foxglove/studio-base/players/types";

export type PlayerSourceDefinition = {
  id: string;
  name: string;

  component: FunctionComponent<unknown>;
};

/*
type FileSourceParams = {
  files?: File[];
};

type FolderSourceParams = {
  folder?: string;
};

type HttpSourceParams = {
  url?: string;
};

type SpecializedPlayerSource<T extends SourceTypes> = Omit<PlayerSourceDefinition, "type"> & {
  type: T;
};
*/

/*
interface SelectSourceFunction {
  (definition: SpecializedPlayerSource<"ros1-local-bagfile">, params?: FileSourceParams): void;
  (definition: SpecializedPlayerSource<"ros2-folder">, params?: FolderSourceParams): void;
  (definition: SpecializedPlayerSource<"ros1-remote-bagfile">, params?: HttpSourceParams): void;
  (definition: PlayerSourceDefinition, params?: never): void;
}
*/

// PlayerSelection provides the user with a select function and the items to select
export interface PlayerSelection {
  selectSource: (player: Player) => void;
  availableSources: PlayerSourceDefinition[];
  currentSourceName?: string;
}

const PlayerSelectionContext = createContext<PlayerSelection>({
  selectSource: () => {},
  availableSources: [],
});

export function usePlayerSelection(): PlayerSelection {
  return useContext(PlayerSelectionContext);
}

export default PlayerSelectionContext;
