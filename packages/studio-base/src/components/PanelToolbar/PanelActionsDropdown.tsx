// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
//
// This file incorporates work covered by the following copyright and
// permission notice:
//
//   Copyright 2018-2021 Cruise LLC
//
//   This source code is licensed under the Apache License, Version 2.0,
//   found at http://www.apache.org/licenses/LICENSE-2.0
//   You may not use this file except in compliance with the License.

import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Divider, Menu, MenuItem } from "@mui/material";
import { useCallback, useContext, useMemo, useRef, useState } from "react";
import { MosaicContext, MosaicNode, MosaicWindowContext } from "react-mosaic-component";
import { makeStyles } from "tss-react/mui";

import PanelContext from "@foxglove/studio-base/components/PanelContext";
import ChangePanelMenuItem from "@foxglove/studio-base/components/PanelToolbar/ChangePanelMenuItem";
import ToolbarIconButton from "@foxglove/studio-base/components/PanelToolbar/ToolbarIconButton";
import { getPanelTypeFromMosaic } from "@foxglove/studio-base/components/PanelToolbar/utils";
import { useCurrentLayoutActions } from "@foxglove/studio-base/context/CurrentLayoutContext";

type Props = {
  isUnknownPanel: boolean;
};

const useStyles = makeStyles()((theme) => ({
  error: { color: theme.palette.error.main },
}));

export function PanelActionsDropdown({ isUnknownPanel }: Props): JSX.Element {
  const { classes } = useStyles();
  const [anchorEl, setAnchorEl] = useState<undefined | HTMLElement>(undefined);
  const menuOpen = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(undefined);
  };

  const panelContext = useContext(PanelContext);
  const tabId = panelContext?.tabId;
  const { mosaicActions } = useContext(MosaicContext);
  const { mosaicWindowActions } = useContext(MosaicWindowContext);
  const {
    getCurrentLayoutState: getCurrentLayout,
    closePanel,
    splitPanel,
  } = useCurrentLayoutActions();
  const getPanelType = useCallback(
    () => getPanelTypeFromMosaic(mosaicWindowActions, mosaicActions),
    [mosaicActions, mosaicWindowActions],
  );

  const close = useCallback(() => {
    closePanel({
      tabId,
      root: mosaicActions.getRoot() as MosaicNode<string>,
      path: mosaicWindowActions.getPath(),
    });
  }, [closePanel, mosaicActions, mosaicWindowActions, tabId]);

  const split = useCallback(
    (id: string | undefined, direction: "row" | "column") => {
      const type = getPanelType();
      if (id == undefined || type == undefined) {
        throw new Error("Trying to split unknown panel!");
      }

      const config = getCurrentLayout().selectedLayout?.data?.configById[id] ?? {};
      splitPanel({
        id,
        tabId,
        direction,
        root: mosaicActions.getRoot() as MosaicNode<string>,
        path: mosaicWindowActions.getPath(),
        config,
      });
    },
    [getCurrentLayout, getPanelType, mosaicActions, mosaicWindowActions, splitPanel, tabId],
  );

  const menuItems = useMemo(() => {
    const items = [];

    if (!isUnknownPanel) {
      items.push(
        {
          key: "hsplit",
          text: "Split horizontal",
          onClick: () => split(panelContext?.id, "column"),
        },
        {
          key: "vsplit",
          text: "Split vertical",
          onClick: () => split(panelContext?.id, "row"),
        },
      );
    }

    if (panelContext?.isFullscreen !== true) {
      items.push({
        key: "enter-fullscreen",
        text: "Fullscreen",
        onClick: panelContext?.enterFullscreen,
        "data-testid": "panel-menu-fullscreen",
      });
    }

    items.push({ key: "divider", type: "divider" });

    items.push({
      key: "remove",
      text: "Remove panel",
      onClick: close,
      "data-testid": "panel-menu-remove",
      className: classes.error,
    });

    return items;
  }, [classes, close, isUnknownPanel, panelContext, split]);

  const buttonRef = useRef<HTMLDivElement>(ReactNull);
  const type = getPanelType();

  if (type == undefined) {
    return <></>;
  }

  return (
    <div ref={buttonRef}>
      <ToolbarIconButton
        id="panel-menu-button"
        aria-controls={menuOpen ? "panel-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={menuOpen ? "true" : undefined}
        onClick={handleClick}
        data-testid="panel-menu"
        title="More"
      >
        <MoreVertIcon />
      </ToolbarIconButton>
      <Menu
        id="panel-menu"
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        MenuListProps={{
          "aria-labelledby": "panel-menu-button",
        }}
      >
        <ChangePanelMenuItem tabId={tabId} />
        {menuItems.map((item, idx) =>
          item.type === "divider" ? (
            <Divider key={`divider-${idx}`} variant="middle" />
          ) : (
            <MenuItem
              key={item.key}
              onClick={item.onClick}
              className={item.className}
              data-testid={item["data-testid"]}
            >
              {item.text}
            </MenuItem>
          ),
        )}
      </Menu>
    </div>
  );
}
