// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Menu, MenuItem, MenuItemProps, MenuProps } from "@mui/material";
import { MouseEvent, useCallback, useMemo } from "react";
import { useCopyToClipboard } from "react-use";

import { filterMap } from "@foxglove/den/collection";
import { TopicListItem } from "@foxglove/studio-base/components/TopicList/useTopicListSearch";

type ContextMenuItemProps = { key: string } & Partial<MenuItemProps>;

export function ContextMenu(
  props: MenuProps & { treeItems: TopicListItem[]; selectedIndexes: Set<number> },
): JSX.Element {
  const { treeItems, selectedIndexes, ...other } = props;
  const [, copyToClipboard] = useCopyToClipboard();

  const handleClose = useCallback(
    (event: MouseEvent<HTMLLIElement>) => {
      props.onClose?.(event, "backdropClick");
    },
    [props],
  );

  const handleCopy = useCallback(
    (event: MouseEvent<HTMLLIElement>, value: string) => {
      handleClose(event);
      copyToClipboard(value);
    },
    [copyToClipboard, handleClose],
  );

  const selectedListItems = filterMap(
    Array.from(selectedIndexes).sort(),
    (index: number) => treeItems[index],
  );

  const menuItems = useMemo(() => {
    const items: ContextMenuItemProps[] = [
      {
        key: "copy-field-name",
        children: `Copy ${
          selectedListItems.length > 1 ? "selected message paths" : "message path"
        }`,
        onClick: (event) => {
          handleCopy(
            event,
            selectedListItems
              .map(({ item, type }) => (type === "topic" ? item.item.name : item.item.fullPath))
              .join(","),
          );
        },
      },
    ];
    if (selectedListItems.length === 1) {
      items.push({
        key: "copy-field-schema-name",
        children: `Copy schema name`,
        onClick: (event) => {
          const schemaName =
            selectedListItems[0]?.type === "topic"
              ? selectedListItems[0]?.item?.item?.schemaName
              : selectedListItems[0]?.item?.item?.suffix?.type;

          if (schemaName != undefined) {
            handleCopy(event, schemaName);
          }
        },
      });
    }
    return items;
  }, [handleCopy, selectedListItems]);

  return (
    <Menu
      {...other}
      anchorReference="anchorPosition"
      MenuListProps={{
        dense: true,
      }}
    >
      {menuItems.map(({ key, ...item }) => (
        <MenuItem key={key} {...item} />
      ))}
    </Menu>
  );
}
