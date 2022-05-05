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

import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { IconButton, styled as muiStyled } from "@mui/material";
import { makeStyles } from "@mui/styles";
import cx from "classnames";
import React, { Ref as ReactRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import textMetrics from "text-metrics";

import { LegacyInput } from "@foxglove/studio-base/components/LegacyStyledComponents";
import { TabActions } from "@foxglove/studio-base/panels/Tab/TabDndContext";
import { fonts } from "@foxglove/studio-base/util/sharedStyleConstants";

const MAX_TAB_WIDTH = 100;
const MIN_ACTIVE_TAB_WIDTH = 40;
const MIN_OTHER_TAB_WIDTH = 14;

const Tab = muiStyled("div")<{
  active: boolean;
  dragging: boolean;
  highlighted: boolean;
  hidden: boolean;
  tabCount: number;
  title: string;
}>(({ active, dragging, highlighted, hidden, tabCount, title, theme }) => ({
  position: "relative",
  borderTopLeftRadius: theme.shape.borderRadius,
  borderTopRightRadius: theme.shape.borderRadius,
  display: "flex",
  alignItems: "center",
  width: "100%",
  height: 26,
  padding: theme.spacing(0, 0.75),
  userSelect: "none",
  border: "1px solid transparent",
  borderBottom: "none",
  backgroundColor: "transparent",
  maxWidth: MAX_TAB_WIDTH,
  top: 5, // Shift the tab down so it's flush with the bottom of the PanelToolbar
  marginTop: -4,
  minWidth: active
    ? `calc(max(${MIN_ACTIVE_TAB_WIDTH}px,  min(${Math.ceil(
        measureText(title) + 30,
      )}px, ${MAX_TAB_WIDTH}px, 100% - ${MIN_OTHER_TAB_WIDTH * (tabCount - 1)}px)))`
    : undefined,

  ...(active && {
    backgroundColor: theme.palette.background.paper,
    borderColor: theme.palette.divider,
    userSelect: "all",
    zIndex: 1,
  }),
  ...(dragging && {
    backgroundColor: theme.palette.background.paper,
    borderColor: theme.palette.action.selected,
  }),
  ...(highlighted && {
    borderColor: theme.palette.action.focus,
  }),
  ...(hidden && {
    visibility: "hidden",
  }),
}));

const StyledIconButton = muiStyled(IconButton)(({ theme }) => ({
  padding: theme.spacing(0.25),
}));

const useStyles = makeStyles({
  input: {
    backgroundColor: "transparent !important",
    padding: "0px !important",
    pointerEvents: "none",
    width: "100%",

    "&.isEditable": {
      pointerEvents: "all",
    },
  },
});

const fontFamily = fonts.SANS_SERIF;
const fontSize = "12px";

let textMeasure: undefined | textMetrics.TextMeasure;

function measureText(text: string): number {
  if (textMeasure == undefined) {
    textMeasure = textMetrics.init({ fontFamily, fontSize });
  }
  return textMeasure.width(text) + 3;
}

type Props = {
  hidden: boolean;
  highlight: boolean;
  innerRef?: ReactRef<HTMLDivElement>;
  isActive: boolean;
  isDragging: boolean;
  actions: TabActions;
  tabCount: number;
  tabIndex: number;
  tabTitle?: string;
};

export function ToolbarTab(props: Props): JSX.Element {
  const {
    tabIndex,
    isActive,
    tabCount,
    tabTitle = "",
    isDragging,
    actions,
    innerRef,
    highlight,
    hidden,
  } = props;
  const styles = useStyles();

  const inputRef = useRef<HTMLInputElement>(ReactNull);
  const [title, setTitle] = useState<string>(tabTitle);
  const [editingTitle, setEditingTitle] = useState<boolean>(false);
  const onChangeTitleInput = useCallback(
    (ev: React.ChangeEvent<HTMLInputElement>) => setTitle(ev.target.value),
    [],
  );

  const { selectTab, removeTab } = useMemo(
    () => ({
      selectTab: () => actions.selectTab(tabIndex),
      removeTab: () => actions.removeTab(tabIndex),
    }),
    [actions, tabIndex],
  );
  const setTabTitle = useCallback(
    () => actions.setTabTitle(tabIndex, title),
    [actions, tabIndex, title],
  );

  const onClickTab = useCallback(() => {
    if (!isActive) {
      selectTab();
    } else {
      setEditingTitle(true);

      setImmediate(() => {
        if (inputRef.current) {
          const inputEl: HTMLInputElement = inputRef.current;
          inputEl.focus();
          inputEl.select();
        }
      });
    }
  }, [isActive, selectTab, inputRef]);

  const endTitleEditing = useCallback(() => {
    setEditingTitle(false);
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, []);

  const confirmNewTitle = useCallback(() => {
    setTabTitle();
    endTitleEditing();
  }, [endTitleEditing, setTabTitle]);

  const resetTitle = useCallback(() => {
    setTitle(tabTitle);
    endTitleEditing();
  }, [endTitleEditing, tabTitle]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Escape") {
        resetTitle();
      } else if (event.key === "Enter") {
        confirmNewTitle();
      }
    },
    [confirmNewTitle, resetTitle],
  );

  // If the tab is no longer active, stop editing the title
  useEffect(() => {
    if (!isActive) {
      setEditingTitle(false);
    }
  }, [isActive]);

  // Update the cached title if the tabTitle changes
  useEffect(() => {
    setTitle(tabTitle);
  }, [tabTitle]);

  return (
    <Tab
      active={isActive}
      dragging={isDragging}
      highlighted={highlight}
      hidden={hidden}
      onClick={onClickTab}
      ref={innerRef}
      title={tabTitle ? tabTitle : "Enter tab name"}
      tabCount={tabCount}
    >
      <div>
        <LegacyInput
          className={cx(styles.input, { isEditable: editingTitle })}
          readOnly={!editingTitle}
          placeholder="Enter tab name"
          value={title}
          onChange={onChangeTitleInput}
          onBlur={setTabTitle}
          onKeyDown={onKeyDown}
          ref={inputRef}
        />
      </div>
      {isActive && (
        <StyledIconButton
          edge="end"
          size="small"
          data-test="tab-icon"
          title={editingTitle ? "Set new name" : "Remove tab"}
          onClick={editingTitle ? confirmNewTitle : removeTab}
        >
          {editingTitle ? <CheckIcon fontSize="inherit" /> : <CloseIcon fontSize="inherit" />}
        </StyledIconButton>
      )}
    </Tab>
  );
}
