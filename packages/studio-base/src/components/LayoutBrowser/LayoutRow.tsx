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
import { useMountedState } from "react-use";

import { useLayoutManager } from "@foxglove/studio-base/context/LayoutManagerContext";
import LayoutStorageDebuggingContext from "@foxglove/studio-base/context/LayoutStorageDebuggingContext";
import { useConfirm } from "@foxglove/studio-base/hooks/useConfirm";
import { Layout, layoutIsShared } from "@foxglove/studio-base/services/ILayoutStorage";

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
  onSelect,
  onRename,
  onDuplicate,
  onDelete,
  onShare,
  onExport,
  onOverwrite,
  onRevert,
  onMakePersonalCopy,
}: {
  layout: Layout;
  selected: boolean;
  onSelect: (item: Layout, selectedViaClick?: boolean) => void;
  onRename: (item: Layout, newName: string) => void;
  onDuplicate: (item: Layout) => void;
  onDelete: (item: Layout) => void;
  onShare: (item: Layout) => void;
  onExport: (item: Layout) => void;
  onOverwrite: (item: Layout) => void;
  onRevert: (item: Layout) => void;
  onMakePersonalCopy: (item: Layout) => void;
}): JSX.Element {
  const styles = useStyles();
  const theme = useTheme();
  const isMounted = useMountedState();

  const [editingName, setEditingName] = useState(false);
  const [nameFieldValue, setNameFieldValue] = useState("");

  const layoutStorage = useLayoutManager();

  // const saveAction = useCallback(() => {
  //   onSave(layout);
  // }, [layout, onSave]);

  const overwriteAction = useCallback(() => {
    onOverwrite(layout);
  }, [layout, onOverwrite]);
  const revertAction = useCallback(() => {
    onRevert(layout);
  }, [layout, onRevert]);
  const makePersonalCopyAction = useCallback(() => {
    onMakePersonalCopy(layout);
  }, [layout, onMakePersonalCopy]);

  const renameAction = useCallback(() => {
    setEditingName(true);
    setNameFieldValue(layout.name);
  }, [layout]);

  const onClick = useCallback(() => {
    if (selected) {
      renameAction();
    } else {
      onSelect(layout, true);
    }
  }, [layout, onSelect, renameAction, selected]);

  const duplicateAction = useCallback(() => onDuplicate(layout), [layout, onDuplicate]);

  const shareAction = useCallback(() => onShare(layout), [layout, onShare]);
  const exportAction = useCallback(() => onExport(layout), [layout, onExport]);

  const onSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      if (!editingName) {
        return;
      }
      const newName = nameFieldValue;
      if (newName && newName !== layout.name) {
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
    // When focusing via right-click we need an extra tick to be able to successfully focus the field
    setTimeout(() => {
      field?.select();
    }, 0);
  }, []);

  const confirm = useConfirm();

  const layoutDebug = useContext(LayoutStorageDebuggingContext);

  const confirmDelete = useCallback(() => {
    void confirm({
      title: `Delete “${layout.name}”?`,
      ok: "Delete",
      variant: "danger",
    }).then((response) => {
      if (response === "ok" && isMounted()) {
        onDelete(layout);
      }
    });
  }, [confirm, isMounted, layout, onDelete]);

  const menuItems: (boolean | IContextualMenuItem)[] = [
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
    layoutStorage.supportsSharing &&
      !layoutIsShared(layout) && {
        key: "share",
        text: "Share",
        iconProps: { iconName: "Share" },
        onClick: shareAction,
      },
    {
      key: "export",
      text: "Export",
      iconProps: { iconName: "DownloadDocument" },
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
      onClick: confirmDelete,
      ["data-test"]: "delete-layout",
    },
  ];

  const deletedOnServer = layout.remote?.syncStatus === "remotely-deleted";
  if (layout.working != undefined) {
    menuItems.unshift(
      {
        key: "overwrite",
        text: "Save changes",
        iconProps: { iconName: "Upload" },
        onClick: overwriteAction,
        disabled: deletedOnServer,
      },
      {
        key: "revert",
        text: "Revert to last saved version",
        iconProps: { iconName: "Undo" },
        onClick: revertAction,
        disabled: deletedOnServer,
      },
      { key: "modified_divider", itemType: ContextualMenuItemType.Divider },
    );
    if (layoutIsShared(layout)) {
      menuItems.unshift({
        key: "copy_to_personal",
        text: "Save as a personal copy",
        iconProps: { iconName: "DependencyAdd" },
        onClick: makePersonalCopyAction,
      });
    }
    if (deletedOnServer) {
      menuItems.unshift({
        key: "deleted_on_server",
        text: "Someone else has deleted this layout.",
        disabled: true,
      });
    }
  }

  if (layoutDebug) {
    menuItems.push(
      { key: "debug_divider", itemType: ContextualMenuItemType.Divider },
      {
        key: "debug_id",
        text: layout.id,
        disabled: true,
        itemProps: {
          styles: {
            root: { ...debugBorder, borderRight: "none", borderTop: "none", borderBottom: "none" },
          },
        },
      },
      {
        key: "debug_updated_at",
        text: `Saved at: ${layout.working?.savedAt ?? layout.baseline.savedAt}`,
        disabled: true,
        itemProps: {
          styles: {
            root: { ...debugBorder, borderRight: "none", borderTop: "none", borderBottom: "none" },
          },
        },
      },
    );
  }
  if (layoutDebug?.injectEdit) {
    menuItems.push({
      key: "debug_edit",
      text: "Inject edit",
      iconProps: { iconName: "TestBeakerSolid" },
      onClick: () => void layoutDebug.injectEdit?.(layout.id),
      itemProps: {
        styles: {
          root: { ...debugBorder, borderRight: "none", borderTop: "none", borderBottom: "none" },
        },
      },
    });
  }
  if (layoutDebug?.injectRename) {
    menuItems.push({
      key: "debug_rename",
      text: "Inject rename",
      iconProps: { iconName: "TestBeakerSolid" },
      onClick: () => void layoutDebug.injectRename?.(layout.id),
      itemProps: {
        styles: {
          root: { ...debugBorder, borderRight: "none", borderTop: "none", borderBottom: "none" },
        },
      },
    });
  }
  if (layoutDebug?.injectDelete) {
    menuItems.push({
      key: "debug_delete",
      text: "Inject delete",
      iconProps: { iconName: "TestBeakerSolid" },
      onClick: () => void layoutDebug.injectDelete?.(layout.id),
      itemProps: {
        styles: {
          root: { ...debugBorder, borderRight: "none", borderTop: "none", borderBottom: "none" },
        },
      },
    });
  }

  const filteredItems = menuItems.filter(
    (item): item is IContextualMenuItem => typeof item === "object",
  );

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
          items={filteredItems}
          onDismiss={() => setContextMenuEvent(undefined)}
        />
      )}
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
          iconProps={{
            iconName: layout.working != undefined ? (deletedOnServer ? "Error" : "Info") : "More",
            styles: {
              root: {
                "& span": { verticalAlign: "baseline" },
                color: deletedOnServer ? theme.semanticColors.errorIcon : undefined,
              },
            },
          }}
          onRenderMenuIcon={() => ReactNull}
          menuProps={{ items: filteredItems }}
        />
      )}
    </Stack>
  );
}
