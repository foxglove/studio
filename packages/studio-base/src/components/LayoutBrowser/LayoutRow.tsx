// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  ContextualMenuItemType,
  IconButton,
  TextField,
  ITextField,
  makeStyles,
  Stack,
  useTheme,
  IContextualMenuItem,
  ContextualMenu,
} from "@fluentui/react";
import cx from "classnames";
import { useCallback, useContext, useState } from "react";

import { useTooltip } from "@foxglove/studio-base/components/Tooltip";
import useConfirm from "@foxglove/studio-base/components/useConfirm";
import LayoutStorageDebuggingContext from "@foxglove/studio-base/context/LayoutStorageDebuggingContext";
import { LayoutMetadata } from "@foxglove/studio-base/services/ILayoutStorage";
import { nonEmptyOrUndefined } from "@foxglove/studio-base/util/emptyOrUndefined";

import { debugBorder } from "./styles";

const useStyles = makeStyles((theme) => ({
  layoutRow: {
    cursor: "pointer",
    paddingLeft: theme.spacing.m,
    paddingRight: theme.spacing.s1,
    ":hover": {
      background: theme.semanticColors.listItemBackgroundHovered,
    },
  },

  layoutRowSelected: {
    background: theme.semanticColors.listItemBackgroundChecked,
    ":hover": {
      background: theme.semanticColors.listItemBackgroundCheckedHovered,
    },
  },

  // Pin the "hover" style when the right-click menu is open
  layoutRowWithOpenMenu: {
    background: theme.semanticColors.listItemBackgroundHovered,
  },
  layoutRowSelectedWithOpenMenu: {
    background: theme.semanticColors.listItemBackgroundCheckedHovered,
  },

  layoutName: {
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    overflow: "hidden",
    lineHeight: theme.spacing.l2, // avoid descenders being cut off
  },
}));

export default function LayoutRow({
  layout,
  selected,
  onSave,
  onSelect,
  onRename,
  onDuplicate,
  onDelete,
  onExport,
}: {
  layout: LayoutMetadata;
  selected: boolean;
  onSave: (item: LayoutMetadata) => void;
  onSelect: (item: LayoutMetadata) => void;
  onRename: (item: LayoutMetadata, newName: string) => void;
  onDuplicate: (item: LayoutMetadata) => void;
  onDelete: (item: LayoutMetadata) => void;
  onExport: (item: LayoutMetadata) => void;
}): JSX.Element {
  const styles = useStyles();
  const theme = useTheme();

  const [editingName, setEditingName] = useState(false);
  const [nameFieldValue, setNameFieldValue] = useState("");

  const saveAction = useCallback(() => {
    onSave(layout);
  }, [layout, onSave]);

  const renameAction = useCallback(() => {
    setEditingName(true);
    setNameFieldValue(layout.name);
  }, [layout]);

  const onClick = useCallback(() => {
    if (selected) {
      renameAction();
    } else {
      onSelect(layout);
    }
  }, [layout, onSelect, renameAction, selected]);

  const duplicateAction = useCallback(() => onDuplicate(layout), [layout, onDuplicate]);

  const exportAction = useCallback(() => onExport(layout), [layout, onExport]);

  const onSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      if (!editingName) {
        return;
      }
      const newName = nonEmptyOrUndefined(nameFieldValue);
      if (newName != undefined && newName !== layout.name) {
        onRename(layout, newName);
      }
      setEditingName(false);
    },
    [editingName, layout, nameFieldValue, onRename],
  );

  const onTextFieldKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      setEditingName(false);
    }
  }, []);

  const onTextFieldMount = useCallback((field: ITextField | ReactNull) => {
    field?.select();
  }, []);

  const confirmDelete = useConfirm({
    title: `Delete “${layout.name}”?`,
    action: (ok) => ok && onDelete(layout),
    ok: "Delete",
    confirmStyle: "danger",
  });

  const unsyncedChangesTooltip = useTooltip({
    contents: layout.hasUnsyncedChanges ? "Changes not synced" : undefined,
  });

  const layoutDebug = useContext(LayoutStorageDebuggingContext);

  const menuItems: IContextualMenuItem[] = [
    {
      key: "save",
      text: layout.hasUnsyncedChanges ? "Save changes" : "No changes",
      iconProps: { iconName: "Upload" },
      onClick: saveAction,
      ["data-test"]: "save-layout",
      disabled: !layout.hasUnsyncedChanges,
    },
    {
      key: "rename",
      text: "Rename",
      iconProps: { iconName: "Rename" },
      onClick: renameAction,
      ["data-test"]: "rename-layout",
    },
    {
      key: "duplicate",
      text: "Duplicate",
      iconProps: { iconName: "Copy" },
      onClick: duplicateAction,
      ["data-test"]: "duplicate-layout",
    },
    {
      key: "export",
      text: "Export",
      iconProps: { iconName: "Share" },
      onClick: exportAction,
    },
    { key: "divider_1", itemType: ContextualMenuItemType.Divider },
    {
      key: "delete",
      text: "Delete…",
      iconProps: {
        iconName: "Delete",
        styles: { root: { color: theme.semanticColors.errorText } },
      },
      onClick: confirmDelete.open,
      ["data-test"]: "delete-layout",
    },
  ];

  if (layoutDebug?.useFakeRemoteLayoutStorage === true) {
    menuItems.push(
      { key: "debug_divider", itemType: ContextualMenuItemType.Divider },
      {
        key: "debug_edit",
        text: "Inject edit",
        iconProps: { iconName: "TestBeakerSolid" },
        onClick: () => void layoutDebug.injectEdit(layout.id),
        itemProps: {
          styles: {
            root: { ...debugBorder, borderRight: "none", borderTop: "none", borderBottom: "none" },
          },
        },
      },
      {
        key: "debug_delete",
        text: "Inject delete",
        iconProps: { iconName: "TestBeakerSolid" },
        onClick: () => void layoutDebug.injectDelete(layout.id),
        itemProps: {
          styles: {
            root: { ...debugBorder, borderRight: "none", borderTop: "none", borderBottom: "none" },
          },
        },
      },
    );
  }

  const [contextMenuEvent, setContextMenuEvent] = useState<MouseEvent | undefined>();

  return (
    <Stack
      as="form"
      horizontal
      verticalAlign="center"
      className={cx(styles.layoutRow, {
        [styles.layoutRowSelected]: selected,
        [styles.layoutRowWithOpenMenu]: contextMenuEvent != undefined,
        [styles.layoutRowSelectedWithOpenMenu]: selected && contextMenuEvent != undefined,
      })}
      onClick={editingName ? undefined : onClick}
      onSubmit={onSubmit}
      onContextMenu={(event) => {
        event.preventDefault();
        setContextMenuEvent(event.nativeEvent);
      }}
    >
      {contextMenuEvent && (
        <ContextualMenu
          target={contextMenuEvent}
          items={menuItems}
          onDismiss={() => setContextMenuEvent(undefined)}
        />
      )}
      {unsyncedChangesTooltip.tooltip}
      {confirmDelete.modal}
      <Stack.Item grow className={styles.layoutName} title={layout.name}>
        {editingName ? (
          <TextField
            componentRef={onTextFieldMount}
            value={nameFieldValue}
            onChange={(_event, newValue) => newValue != undefined && setNameFieldValue(newValue)}
            onKeyDown={onTextFieldKeyDown}
          />
        ) : (
          layout.name
        )}
      </Stack.Item>

      {editingName ? (
        <>
          <IconButton
            type="submit"
            iconProps={{ iconName: "CheckMark" }}
            ariaLabel="Rename"
            data-test="commit-rename"
          />
          <IconButton
            iconProps={{ iconName: "Cancel" }}
            onClick={() => setEditingName(false)}
            ariaLabel="Cancel"
            data-test="cancel-rename"
          />
        </>
      ) : (
        <IconButton
          ariaLabel="Layout actions"
          data={{ text: "x" }}
          data-test="layout-actions"
          elementRef={unsyncedChangesTooltip.ref}
          iconProps={{
            iconName: layout.hasUnsyncedChanges ? "Info" : "More", // FIXME: better icon
            styles: { root: { "& span": { verticalAlign: "baseline" } } },
          }}
          onRenderMenuIcon={() => ReactNull}
          menuProps={{ items: menuItems }}
        />
      )}
    </Stack>
  );
}
