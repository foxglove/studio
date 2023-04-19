// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  Divider,
  Menu,
  MenuItem,
  PopoverPosition,
  PopoverProps,
  PopoverReference,
} from "@mui/material";
import { useCallback, useMemo, useState } from "react";
import { makeStyles } from "tss-react/mui";

import { Time, compare } from "@foxglove/rostime";
import {
  MessagePipelineContext,
  useMessagePipeline,
  useMessagePipelineGetter,
} from "@foxglove/studio-base/components/MessagePipeline";
import { NestedMenuItem } from "@foxglove/studio-base/components/NestedMenuItem";
import TextMiddleTruncate from "@foxglove/studio-base/components/TextMiddleTruncate";
import { useAnalytics } from "@foxglove/studio-base/context/AnalyticsContext";
import { useCurrentUserType } from "@foxglove/studio-base/context/CurrentUserContext";
import { usePlayerSelection } from "@foxglove/studio-base/context/PlayerSelectionContext";
import { AppEvent } from "@foxglove/studio-base/services/IAnalytics";

type AppMenuProps = {
  handleClose: PopoverProps["onClose"];
  anchorEl?: HTMLElement;
  anchorReference?: PopoverReference;
  anchorPosition?: PopoverPosition;
  disablePortal?: boolean;
  open: boolean;
};

const useStyles = makeStyles<void, "icon">()((theme, _params, classes) => ({
  menuItem: {
    justifyContent: "space-between",
    cursor: "pointer",
    gap: theme.spacing(2),

    "&.Mui-selected, &.Mui-selected:hover": {
      backgroundColor: theme.palette.action.hover,
    },
    [`:not(:hover, :focus) .${classes.icon}`]: {
      opacity: 0.6,
    },
    kbd: {
      font: "inherit",
      color: theme.palette.text.disabled,
    },
  },
  menuList: {
    minWidth: 180,
    maxWidth: 220,
  },
  icon: {},
  truncate: {
    alignSelf: "center !important",
  },
}));

const selectIsPlaying = (ctx: MessagePipelineContext) =>
  ctx.playerState.activeData?.isPlaying === true;
const selectPause = (ctx: MessagePipelineContext) => ctx.pausePlayback;
const selectPlay = (ctx: MessagePipelineContext) => ctx.startPlayback;
const selectSeek = (ctx: MessagePipelineContext) => ctx.seekPlayback;

export function AppMenu(props: AppMenuProps): JSX.Element {
  const { open, handleClose, anchorEl, anchorReference, anchorPosition, disablePortal } = props;
  const { classes } = useStyles();

  const [subMenu, setSubMenu] = useState<undefined | HTMLElement>(undefined);
  const subMenuOpen = Boolean(subMenu);

  const currentUserType = useCurrentUserType();
  const analytics = useAnalytics();

  const { recentSources, selectRecent } = usePlayerSelection();

  const fileItems = useMemo(() => {
    const items: NestedMenuItem[] = [
      { type: "item", label: "Open local file…", key: "open-file", onClick: () => {} },
      { type: "item", label: "Open connection…", key: "open-connection", onClick: () => {} },
      { type: "divider" },
      { type: "item", label: "Recent sources", key: "recent-sources", disabled: true },
    ];

    recentSources.slice(0, 5).map((recent) => {
      items.push({
        type: "item",
        key: recent.id,
        onClick: () => selectRecent(recent.id),
        label: <TextMiddleTruncate text={recent.title} className={classes.truncate} />,
      });
    });

    return items;
  }, [classes.truncate, recentSources, selectRecent]);

  const editItems = useMemo(
    () =>
      [
        { type: "item", label: "Copy", key: "copy", shortcut: "⌘C" },
        { type: "item", label: "Copy timestamp", key: "copy-timestamp", shortcut: "⌘⇧C" },
        { type: "item", label: "Paste", key: "paste", shortcut: "⌘V" },
        { type: "item", label: "Select all", key: "select-all", shortcut: "⌘A" },
        { type: "divider" },
        { type: "item", label: "Find", key: "find", shortcut: "⌘F" },
      ] as NestedMenuItem[],
    [],
  );

  const panelItems = useMemo(
    () =>
      [
        { type: "item", label: "Maximize panel", key: "maximize", shortcut: "⌘⌥F" },
        { type: "divider" },
        { type: "item", label: "Change panel", key: "change-panel" },
        { type: "item", label: "Split up", key: "split-up" },
        { type: "item", label: "Split down", key: "split-down" },
        { type: "item", label: "Split left", key: "split-left" },
        { type: "item", label: "Split right", key: "split-right" },
        { type: "divider" },
        { type: "item", label: "Remove panel", key: "remove-panel" },
      ] as NestedMenuItem[],
    [],
  );

  const viewItems = useMemo(
    () =>
      [
        { type: "item", label: "Left sidebar", key: "left-sidebar", shortcut: "[" },
        { type: "item", label: "Right sidebar", key: "left-sidebar", shortcut: "]" },
        { type: "divider" },
        { type: "item", label: "Add panel", key: "add-panel" },
      ] as NestedMenuItem[],
    [],
  );

  // HELP

  const onDocsClick = useCallback(() => {
    void analytics.logEvent(AppEvent.APP_MENU_CLICK, {
      user: currentUserType,
      cta: "docs",
    });
    window.open("https://foxglove.dev/docs", "_blank");
  }, [analytics, currentUserType]);

  const onSlackClick = useCallback(() => {
    void analytics.logEvent(AppEvent.APP_MENU_CLICK, {
      user: currentUserType,
      cta: "join-slack",
    });
    window.open("https://foxglove.dev/slack", "_blank");
  }, [analytics, currentUserType]);

  const helpItems = useMemo(
    () =>
      [
        { type: "item", label: "Documentation", key: "docs", onClick: onDocsClick },
        { type: "item", label: "Join Slack", key: "slack", onClick: onSlackClick },
      ] as NestedMenuItem[],
    [onDocsClick, onSlackClick],
  );

  return (
    <>
      <Menu
        anchorEl={anchorEl}
        anchorReference={anchorReference}
        anchorPosition={anchorPosition}
        disablePortal={disablePortal}
        id="app-menu"
        open={open}
        disableAutoFocusItem
        onClose={handleClose}
        MenuListProps={{ dense: true, className: classes.menuList }}
      >
        <MenuItem className={classes.menuItem}>Back to Data Platform</MenuItem>
        <Divider variant="middle" />
        <NestedMenuItem
          setSubMenu={setSubMenu}
          subMenu={subMenu}
          subMenuOpen={subMenuOpen}
          items={fileItems}
          id="app-menu-file"
        >
          File
        </NestedMenuItem>
        <NestedMenuItem
          setSubMenu={setSubMenu}
          subMenu={subMenu}
          subMenuOpen={subMenuOpen}
          items={editItems}
          id="app-menu-edit"
        >
          Edit
        </NestedMenuItem>
        <NestedMenuItem
          setSubMenu={setSubMenu}
          subMenu={subMenu}
          subMenuOpen={subMenuOpen}
          items={viewItems}
          id="app-menu-view"
        >
          View
        </NestedMenuItem>
        <NestedMenuItem
          setSubMenu={setSubMenu}
          subMenu={subMenu}
          subMenuOpen={subMenuOpen}
          items={panelItems}
          id="app-menu-panel"
        >
          Panel
        </NestedMenuItem>
        <NestedMenuItem
          setSubMenu={setSubMenu}
          subMenu={subMenu}
          subMenuOpen={subMenuOpen}
          items={helpItems}
          id="app-menu-help"
        >
          Help
        </NestedMenuItem>
      </Menu>
    </>
  );
}
