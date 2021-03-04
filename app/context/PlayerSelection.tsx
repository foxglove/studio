// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  createContext,
  PropsWithChildren,
  ReactElement,
  useCallback,
  useContext,
  useState,
} from "react";

import { FileContext } from "@foxglove-studio/app/components/FileContext";
import { usePrompt } from "@foxglove-studio/app/hooks/usePrompt";
import { ROSBRIDGE_WEBSOCKET_URL_QUERY_KEY } from "@foxglove-studio/app/util/globalConstants";

interface PlayerSelectionDefinition {
  name: string;
  type: "file" | "url";
}

// PlayerSelection provides the user with a select function and the items to select
interface PlayerSelection {
  select: (definition: PlayerSelectionDefinition) => void;
  items: PlayerSelectionDefinition[];
}

type PlayerSelectionProviderProps = {
  items: PlayerSelectionDefinition[];
};

export const PlayerSelectionContext = createContext<PlayerSelection>({
  select: () => {},
  items: [],
});

// expose consumer for non-hooks component use
export const PlayerSelectionConsumer = PlayerSelectionContext.Consumer;

export function PlayerSelectionProvider(
  props: PropsWithChildren<PlayerSelectionProviderProps>,
): ReactElement {
  const [bagFile, setBagFile] = useState<File | undefined>();
  const prompt = usePrompt();

  const select = useCallback(
    async (definition: PlayerSelectionDefinition) => {
      switch (definition.type) {
        case "file": {
          // The main thread simulated a mouse click for us which allows us to invoke input.click();
          // The idea is to move handling of opening the file to the renderer thread
          const input = document.createElement("input");
          input.setAttribute("type", "file");
          input.setAttribute("accept", ".bag");

          input.addEventListener(
            "input",
            () => {
              if (input.files !== null && input.files.length > 0) {
                setBagFile(input.files[0]);
              }
            },
            { once: true },
          );

          input.click();

          break;
        }
        case "url": {
          const result = await prompt("ws://localhost:9090");

          // Note(roman): Architecturally we should move the param handling out of nested components
          // like PlayerManager and feed in the data providers via context or up-tree components
          // This would simplify PlayerManager and add flexibility to the app at a more appropriate level
          // of abstraction.
          if (result !== undefined) {
            const params = new URLSearchParams(window.location.search);
            params.set(ROSBRIDGE_WEBSOCKET_URL_QUERY_KEY, result);
            window.location.search = params.toString();
          }
          break;
        }
      }
    },
    [prompt],
  );

  const value = {
    select,
    items: props.items,
  };

  return (
    <PlayerSelectionContext.Provider value={value}>
      <FileContext.Provider value={bagFile}>{props.children}</FileContext.Provider>
    </PlayerSelectionContext.Provider>
  );
}

export function usePlayerSelection(): PlayerSelection {
  return useContext(PlayerSelectionContext);
}

export type { PlayerSelectionDefinition, PlayerSelectionProviderProps };
