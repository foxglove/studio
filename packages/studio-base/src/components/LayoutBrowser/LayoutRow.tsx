// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { ContextualMenuItemType, IContextualMenuItem } from "@fluentui/react";
import ErrorIcon from "@mui/icons-material/Error";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import {
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton as MuiIconButton,
  Menu,
  MenuItem,
  SvgIcon,
  Divider,
  Typography,
  TextField,
  styled as muiStyled,
} from "@mui/material";
import {
  Fragment,
  PropsWithChildren,
  // SetStateAction,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { useMountedState } from "react-use";

import { useLayoutManager } from "@foxglove/studio-base/context/LayoutManagerContext";
import LayoutStorageDebuggingContext from "@foxglove/studio-base/context/LayoutStorageDebuggingContext";
import { useConfirm } from "@foxglove/studio-base/hooks/useConfirm";
import { Layout, layoutIsShared } from "@foxglove/studio-base/services/ILayoutStorage";

const StyledListItem = muiStyled(ListItem, {
  shouldForwardProp: (prop) => prop !== "hasModifications" && prop !== "deletedOnServer",
})<{
  hasModifications: boolean;
  deletedOnServer: boolean;
}>(({ hasModifications, deletedOnServer }) => ({
  "@media (pointer: fine)": {
    ".MuiListItemSecondaryAction-root": {
      visibility: !hasModifications && !deletedOnServer && "hidden",
    },
    "&:hover": {
      ".MuiListItemSecondaryAction-root": {
        visibility: "visible",
      },
    },
  },
}));

const StyledMenuItem = muiStyled(MenuItem, {
  shouldForwardProp: (prop) => prop !== "debug",
})<{ debug?: boolean }>(({ theme, debug = false }) => ({
  position: "relative",

  ...(debug && {
    "&:before": {
      content: "''",
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
      backgroundColor: theme.palette.warning.main,
      backgroundImage: `repeating-linear-gradient(${[
        "-35deg",
        "transparent",
        "transparent 6px",
        `${theme.palette.common.black} 6px`,
        `${theme.palette.common.black} 12px`,
      ].join(",")})`,
    },
  }),
}));

const ActionMenu = ({
  children,
  items = [],
}: PropsWithChildren<{ items: IContextualMenuItem[] }>) => {
  const [anchorEl, setAnchorEl] = useState<undefined | HTMLElement>(undefined);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(undefined);
  };

  return (
    <>
      <MuiIconButton
        id="layout-action-button"
        aria-controls={open ? "layout-action-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleClick}
        style={{ marginRight: -13 }}
      >
        {children}
      </MuiIconButton>
      {items.length > 0 && (
        <Menu
          id="layout-action-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          MenuListProps={{
            "aria-labelledby": "layout-action-button",
            dense: true,
          }}
        >
          {items.map((item) =>
            item.itemType === ContextualMenuItemType.Divider ? (
              <Divider variant="middle" key={item.key} />
            ) : item.sectionProps ? (
              <Fragment key={item.key}>
                <StyledMenuItem debug={item.debug} disabled>
                  {item.sectionProps.title}
                </StyledMenuItem>
                {item.sectionProps.items.map((subItem) => (
                  <StyledMenuItem debug={item.debug} key={subItem.key} onClick={subItem.onClick}>
                    <Typography variant="inherit">{subItem.text}</Typography>
                  </StyledMenuItem>
                ))}
                <Divider variant="middle" />
              </Fragment>
            ) : (
              <StyledMenuItem
                debug={item.debug}
                disabled={item.disabled}
                key={item.key}
                onClick={item.onClick}
              >
                <Typography variant="inherit" color={item.key === "delete" ? "error" : undefined}>
                  {item.text}
                </Typography>
              </StyledMenuItem>
            ),
          )}
        </Menu>
      )}
    </>
  );
};

export default React.memo(function LayoutRow({
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
  onSelect: (item: Layout, params?: { selectedViaClick?: boolean }) => void;
  onRename: (item: Layout, newName: string) => void;
  onDuplicate: (item: Layout) => void;
  onDelete: (item: Layout) => void;
  onShare: (item: Layout) => void;
  onExport: (item: Layout) => void;
  onOverwrite: (item: Layout) => void;
  onRevert: (item: Layout) => void;
  onMakePersonalCopy: (item: Layout) => void;
}): JSX.Element {
  const isMounted = useMountedState();
  const confirm = useConfirm();
  const layoutDebug = useContext(LayoutStorageDebuggingContext);
  const layoutManager = useLayoutManager();

  const [editingName, setEditingName] = useState(false);
  const [nameFieldValue, setNameFieldValue] = useState("");
  const [isOnline, setIsOnline] = useState(layoutManager.isOnline);

  const deletedOnServer = layout.syncInfo?.status === "remotely-deleted";
  const hasModifications = layout.working != undefined;

  useLayoutEffect(() => {
    const onlineListener = () => setIsOnline(layoutManager.isOnline);
    onlineListener();
    layoutManager.on("onlinechange", onlineListener);
    return () => {
      layoutManager.off("onlinechange", onlineListener);
    };
  }, [layoutManager]);

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
    if (!selected) {
      onSelect(layout, { selectedViaClick: true });
    }
  }, [layout, onSelect, selected]);

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

  const onBlur = useCallback(
    (event: React.FocusEvent) => {
      onSubmit(event);
    },
    [onSubmit],
  );

  const onTextFieldMount = useCallback((field: HTMLInputElement | ReactNull) => {
    // When focusing via right-click we need an extra tick to be able to successfully focus the field
    setTimeout(() => {
      field?.select();
    }, 0);
  }, []);

  const confirmDelete = useCallback(() => {
    void confirm({
      title: `Delete “${layout.name}”?`,
      prompt: `${
        layoutIsShared(layout) ? "Team members will no longer be able to access this layout." : ""
      } This action cannot be undone.`,
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
      onClick: renameAction,
      ["data-test"]: "rename-layout",
      disabled: layoutIsShared(layout) && !isOnline,
      secondaryText: layoutIsShared(layout) && !isOnline ? "Offline" : undefined,
    },
    // For shared layouts, duplicate first requires saving or discarding changes
    !(layoutIsShared(layout) && hasModifications) && {
      key: "duplicate",
      text:
        layoutManager.supportsSharing && layoutIsShared(layout)
          ? "Make a personal copy"
          : "Duplicate",
      onClick: duplicateAction,
      ["data-test"]: "duplicate-layout",
    },
    layoutManager.supportsSharing &&
      !layoutIsShared(layout) && {
        key: "share",
        text: "Share with team…",
        onClick: shareAction,
        disabled: !isOnline,
        secondaryText: !isOnline ? "Offline" : undefined,
      },
    {
      key: "export",
      text: "Export…",
      onClick: exportAction,
    },
    { key: "divider_1", itemType: ContextualMenuItemType.Divider },
    {
      key: "delete",
      text: "Delete",
      onClick: confirmDelete,
      ["data-test"]: "delete-layout",
    },
  ];

  if (hasModifications) {
    const sectionItems: IContextualMenuItem[] = [
      {
        key: "overwrite",
        text: "Save changes",
        onClick: overwriteAction,
        disabled: deletedOnServer || (layoutIsShared(layout) && !isOnline),
        secondaryText: layoutIsShared(layout) && !isOnline ? "Offline" : undefined,
      },
      {
        key: "revert",
        text: "Revert",
        onClick: revertAction,
        disabled: deletedOnServer,
      },
    ];
    if (layoutIsShared(layout)) {
      sectionItems.push({
        key: "copy_to_personal",
        text: "Make a personal copy",

        onClick: makePersonalCopyAction,
      });
    }
    menuItems.unshift({
      key: "changes",
      itemType: ContextualMenuItemType.Section,
      sectionProps: {
        title: deletedOnServer
          ? "Someone else has deleted this layout"
          : "This layout has unsaved changes",
        items: sectionItems,
      },
    });
  }

  if (layoutDebug) {
    menuItems.push(
      { key: "debug_divider", itemType: ContextualMenuItemType.Divider },
      {
        key: "debug_id",
        text: layout.id,
        disabled: true,
        debug: true,
      },
      {
        key: "debug_updated_at",
        text: `Saved at: ${layout.working?.savedAt ?? layout.baseline.savedAt}`,
        disabled: true,
        debug: true,
      },
      {
        key: "debug_sync_status",
        text: `Sync status: ${layout.syncInfo?.status}`,
        disabled: true,
        debug: true,
      },
      {
        key: "debug_edit",
        text: "Inject edit",
        onClick: () => void layoutDebug.injectEdit(layout.id),
        debug: true,
      },
      {
        key: "debug_rename",
        text: "Inject rename",
        onClick: () => void layoutDebug.injectRename(layout.id),
        debug: true,
      },
      {
        key: "debug_delete",
        text: "Inject delete",
        onClick: () => void layoutDebug.injectDelete(layout.id),
        debug: true,
      },
    );
  }

  const filteredItems = menuItems.filter(
    (item): item is IContextualMenuItem => typeof item === "object",
  );

  const actionIcon = useMemo(
    () =>
      deletedOnServer ? (
        <ErrorIcon fontSize="small" color="error" />
      ) : hasModifications ? (
        <SvgIcon fontSize="small" color="primary">
          <circle cx={12} cy={12} r={4} />
        </SvgIcon>
      ) : (
        <MoreVertIcon fontSize="small" />
      ),
    [deletedOnServer, hasModifications],
  );

  return (
    <StyledListItem
      hasModifications={hasModifications}
      deletedOnServer={deletedOnServer}
      disablePadding
      secondaryAction={<ActionMenu items={filteredItems}>{actionIcon}</ActionMenu>}
    >
      <ListItemButton
        selected={selected}
        onSubmit={onSubmit}
        onClick={editingName ? undefined : onClick}
        component="form"
      >
        <ListItemText disableTypography>
          {editingName ? (
            <TextField
              inputProps={{ ref: onTextFieldMount }}
              // componentRef={onTextFieldMount}
              value={nameFieldValue}
              onChange={(event) => setNameFieldValue(event.target.value)}
              onKeyDown={onTextFieldKeyDown}
              onBlur={onBlur}
              style={{ flex: "auto", font: "inherit" }}
            />
          ) : (
            layout.name
          )}
        </ListItemText>
      </ListItemButton>
    </StyledListItem>
  );
});
