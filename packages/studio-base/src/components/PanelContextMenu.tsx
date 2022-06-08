// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Divider, ListItemIcon, ListItemText, Menu, MenuItem } from "@mui/material";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  MosaicContext,
  MosaicNode,
  MosaicWindowActions,
  MosaicWindowContext,
} from "react-mosaic-component";
import { DeepReadonly } from "ts-essentials";
import { v4 as uuid } from "uuid";

import CommonIcons from "@foxglove/studio-base/components/CommonIcons";
import { usePanelContext } from "@foxglove/studio-base/components/PanelContext";
import { PanelRoot } from "@foxglove/studio-base/components/PanelRoot";
import { useCurrentLayoutActions } from "@foxglove/studio-base/context/CurrentLayoutContext";

/**
 * Types of items that can be included in a context menu. Either a clickable item
 * or a divider.
 */
export type PanelContextMenuItem =
  | {
      /** Type of selectable menu items. */
      type: "item";

      /** True if the item should be shown but disabled. */
      disabled?: boolean;

      /** Optional name of icon to be shown alongside the item label. */
      icon?: keyof typeof CommonIcons;

      /** Unique string id of this item that will be included in the select callback. */
      id: string;

      /** Label shown for the menu item. */
      label: string;
    }
  | {
      /** Type of item dividers. */
      type: "divider";
    };

type PanelContextMenuProps = {
  /**
   * Function that returns a list of menu items, optionally dependent on the x,y
   * position of the click.
   */
  itemsForClickPosition: (position: {
    x: number;
    y: number;
  }) => DeepReadonly<PanelContextMenuItem[]>;

  /**
   * Handler for clicks on menu items.
   */
  selectItem: (item: string) => void;
};

/**
 * This is a convenience component for attaching a context menu to a panel. It
 * must be a child of a Panel component to work.
 */
export function PanelContextMenu(props: PanelContextMenuProps): JSX.Element {
  const { itemsForClickPosition, selectItem } = props;

  const rootRef = useRef<HTMLDivElement>(ReactNull);

  const [defaultActionIds] = useState({ removePanel: uuid() });

  const [position, setPosition] = useState<undefined | { x: number; y: number }>();

  const handleClose = useCallback(() => setPosition(undefined), []);

  const { tabId } = usePanelContext();

  const [items, setItems] = useState<undefined | DeepReadonly<PanelContextMenuItem[]>>();

  const listener = useCallback(
    (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setPosition({ x: event.clientX, y: event.clientY });
      setItems(itemsForClickPosition({ x: event.clientX, y: event.clientY }));
    },
    [itemsForClickPosition],
  );

  const { closePanel } = useCurrentLayoutActions();

  const { mosaicActions } = useContext(MosaicContext);

  const { mosaicWindowActions }: { mosaicWindowActions: MosaicWindowActions } =
    useContext(MosaicWindowContext);

  const removePanel = useCallback(() => {
    closePanel({
      path: mosaicWindowActions.getPath(),
      root: mosaicActions.getRoot() as MosaicNode<string>,
      tabId,
    });
  }, [closePanel, mosaicActions, mosaicWindowActions, tabId]);

  const onSelectItem = useCallback(
    (itemId: string) => {
      handleClose();
      if (itemId === defaultActionIds.removePanel) {
        removePanel();
        return;
      }

      selectItem(itemId);
    },
    [defaultActionIds, handleClose, removePanel, selectItem],
  );

  useEffect(() => {
    const element = rootRef.current;
    if (!element) {
      return;
    }

    const parent: HTMLElement | ReactNull = element.closest(PanelRoot);
    parent?.addEventListener("contextmenu", listener);

    return () => {
      parent?.removeEventListener("contextmenu", listener);
    };
  }, [listener]);

  const completeItems: DeepReadonly<PanelContextMenuItem[]> = useMemo(() => {
    return [
      ...(items ?? []),
      { type: "divider" },
      { type: "item", id: defaultActionIds.removePanel, label: "Remove Panel", icon: "Delete" },
    ];
  }, [defaultActionIds, items]);

  return (
    <div ref={rootRef}>
      <Menu
        open={position != undefined}
        onClose={handleClose}
        anchorReference="anchorPosition"
        anchorPosition={position ? { top: position.y, left: position.x } : undefined}
      >
        {completeItems.map((item, index) => {
          if (item.type === "divider") {
            return <Divider key={`divider_${index}`} />;
          }

          const Icon = item.icon ? CommonIcons[item.icon] : undefined;
          return (
            <MenuItem onClick={() => onSelectItem(item.id)} key={item.id} disabled={item.disabled}>
              {Icon && (
                <ListItemIcon>
                  <Icon fontSize="small" />
                </ListItemIcon>
              )}
              <ListItemText>{item.label}</ListItemText>
            </MenuItem>
          );
        })}
      </Menu>
    </div>
  );
}
