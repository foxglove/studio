// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useCallback, useLayoutEffect, useRef, useState } from "react";

export type OnSelectPayload = {
  index: number;
  modKey: boolean;
  shiftKey: boolean;
};

export function useMultiSelection<T>(source: readonly T[]): {
  selectedIndexes: Set<number>;
  onSelect: (props: OnSelectPayload) => void;
} {
  const [selectedIndexes, setSelectedIndexes] = useState(() => new Set<number>());
  const lastSelectedIndexRef = useRef<number | undefined>();
  useLayoutEffect(() => {
    // Clear selection when the source changes
    setSelectedIndexes(new Set<number>());
    lastSelectedIndexRef.current = undefined;
  }, [source]);

  const onSelect = useCallback(
    ({ index, modKey, shiftKey }: OnSelectPayload) => {
      if (modKey) {
        const newSelectedIndexes = new Set(selectedIndexes);
        if (newSelectedIndexes.has(index)) {
          newSelectedIndexes.delete(index);
        } else {
          newSelectedIndexes.add(index);
        }
        setSelectedIndexes(newSelectedIndexes);
      } else if (shiftKey && lastSelectedIndexRef.current != undefined) {
        const newSelectedIndexes = new Set(selectedIndexes);
        const start = Math.min(lastSelectedIndexRef.current, index);
        const end = Math.max(lastSelectedIndexRef.current, index);
        for (let i = start; i <= end; i++) {
          newSelectedIndexes.add(i);
        }
        setSelectedIndexes(newSelectedIndexes);
      } else {
        setSelectedIndexes(new Set([index]));
      }
      lastSelectedIndexRef.current = index;
    },
    [selectedIndexes, setSelectedIndexes],
  );

  return { selectedIndexes, onSelect };
}
