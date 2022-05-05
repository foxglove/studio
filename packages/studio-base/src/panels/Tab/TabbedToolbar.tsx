// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
//
// This file incorporates work covered by the following copyright and
// permission notice:
//
//   Copyright 2019-2021 Cruise LLC
//
//   This source code is licensed under the Apache License, Version 2.0,
//   found at http://www.apache.org/licenses/LICENSE-2.0
//   You may not use this file except in compliance with the License.

import AddIcon from "@mui/icons-material/Add";
import { IconButton, alpha, styled as muiStyled, useTheme } from "@mui/material";
import { useContext, useEffect } from "react";
import { DropTargetMonitor, useDrop } from "react-dnd";

import PanelToolbar from "@foxglove/studio-base/components/PanelToolbar";
import { useCurrentLayoutActions } from "@foxglove/studio-base/context/CurrentLayoutContext";
import { DraggableToolbarTab } from "@foxglove/studio-base/panels/Tab/DraggableToolbarTab";
import {
  DraggingTabItem,
  TAB_DRAG_TYPE,
  TabActions,
  TabDndContext,
} from "@foxglove/studio-base/panels/Tab/TabDndContext";
import helpContent from "@foxglove/studio-base/panels/Tab/index.help.md";
import { TabConfig } from "@foxglove/studio-base/types/layouts";

const STabbedToolbar = muiStyled("div")<{ highlight: boolean }>(({ highlight, theme }) => ({
  flex: "0 0",
  display: "flex",
  position: "relative",
  flexDirection: "column",
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.default,

  "&:after": {
    border: `2px solid ${highlight ? theme.palette.primary.main : "transparent"}`,
    backgroundColor: highlight
      ? alpha(theme.palette.primary.main, theme.palette.action.focusOpacity)
      : undefined,
    content: "''",
    height: "100%",
    left: 0,
    top: 0,
    pointerEvents: "none",
    position: "absolute",
    width: "100%",
    zIndex: 1,
  },
}));

const STabs = muiStyled("div")({
  flex: "auto",
  display: "flex",
  alignItems: "flex-end",
});

const StyledIconButton = muiStyled(IconButton)(({ theme }) => ({
  padding: theme.spacing(0.25),
  margin: theme.spacing(0, 0.5, -0.25),
}));

type Props = {
  panelId: string;
  actions: TabActions;
  tabs: TabConfig[];
  activeTabIdx: number;
  setDraggingTabState: (arg0: { isOver: boolean; item?: DraggingTabItem }) => void;
};

export function TabbedToolbar(props: Props): JSX.Element {
  const theme = useTheme();
  const { panelId, actions, tabs, activeTabIdx, setDraggingTabState } = props;
  const { moveTab } = useCurrentLayoutActions();

  const { preventTabDrop } = useContext(TabDndContext);
  const [{ isOver, item }, dropRef] = useDrop({
    accept: TAB_DRAG_TYPE,
    collect: (monitor) => ({
      item: monitor.getItem(),
      isOver: monitor.isOver(),
    }),
    canDrop: () => !preventTabDrop,
    drop: (sourceItem: DraggingTabItem, monitor: DropTargetMonitor) => {
      // Drop was already handled by DraggableToolTab, ignore here
      if (monitor.didDrop()) {
        return;
      }
      const source = {
        panelId: sourceItem.panelId,
        tabIndex: sourceItem.tabIndex,
      };
      const target = { panelId };
      moveTab({ source, target });
    },
  });
  useEffect(() => {
    setDraggingTabState({ item, isOver });
  }, [item, isOver, setDraggingTabState]);

  return (
    <STabbedToolbar highlight={isOver}>
      <PanelToolbar helpContent={helpContent}>
        <STabs role="tab" ref={dropRef} data-test="toolbar-droppable">
          {tabs.map((tab, i) => (
            <DraggableToolbarTab
              isActive={activeTabIdx === i}
              key={i}
              panelId={panelId}
              setDraggingTabState={setDraggingTabState}
              actions={actions}
              tabCount={tabs.length}
              tabIndex={i}
              tabTitle={tab.title}
            />
          ))}
          <StyledIconButton
            size="small"
            data-test="add-tab"
            title="Add tab"
            onClick={actions.addTab}
          >
            <AddIcon fontSize="inherit" />
          </StyledIconButton>
        </STabs>
      </PanelToolbar>
    </STabbedToolbar>
  );
}
