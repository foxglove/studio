// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { createContext, useMemo, useRef } from "react";

import { DraggedMessagePath } from "@foxglove/studio";

type MessagePathDragContext = {
  selectedItems: React.RefObject<DraggedMessagePath[]>;
};

export const MessagePathDragContextInternal = createContext<MessagePathDragContext | undefined>(
  undefined,
);

/**
 * Holds state to support dragging multiple message paths at once.
 */
export function MessagePathDragProvider({
  children,
}: React.PropsWithChildren<unknown>): JSX.Element {
  const selectedItems = useRef<DraggedMessagePath[]>([]);
  const value = useMemo(() => ({ selectedItems }), []);
  return (
    <MessagePathDragContextInternal.Provider value={value}>
      {children}
    </MessagePathDragContextInternal.Provider>
  );
}
