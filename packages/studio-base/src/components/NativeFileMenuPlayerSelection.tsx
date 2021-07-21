// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { ReactElement, useEffect, useState } from "react";

import { useNativeAppMenu } from "@foxglove/studio-base/context/NativeAppMenuContext";
import {
  PlayerSourceDefinition,
  usePlayerSelection,
} from "@foxglove/studio-base/context/PlayerSelectionContext";

// NativeFileMenuPlayerSelection adds available player selection items to the apps native OS menubar
export function NativeFileMenuPlayerSelection(): ReactElement {
  const { selectSource, availableSources } = usePlayerSelection();
  const [count, setCount] = useState(0);

  const [selectedSource, setSelectedSource] = useState<PlayerSourceDefinition | undefined>(
    undefined,
  );

  const nativeAppMenu = useNativeAppMenu();

  useEffect(() => {
    if (!nativeAppMenu) {
      return;
    }

    for (const item of availableSources) {
      nativeAppMenu.addFileEntry(item.name, () => {
        // increment count to re-create the selected source component
        setCount((old) => old + 1);
        setSelectedSource(item);
      });
    }

    return () => {
      for (const item of availableSources) {
        nativeAppMenu.removeFileEntry(item.name);
      }
    };
  }, [availableSources, nativeAppMenu, selectSource]);

  // key is used to render a new component when the same source is selected again
  return <>{selectedSource && <selectedSource.component key={count} />}</>;
}
