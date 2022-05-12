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

import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { styled as muiStyled } from "@mui/material";
import { useContext } from "react";

import PanelContext from "@foxglove/studio-base/components/PanelContext";
import ToolbarIconButton from "@foxglove/studio-base/components/PanelToolbar/ToolbarIconButton";

import { PanelActionsDropdown } from "./PanelActionsDropdown";

type PanelToolbarControlsProps = {
  additionalIcons?: React.ReactNode;
  isUnknownPanel: boolean;
  menuOpen: boolean;
  mousePresent?: boolean;
  // eslint-disable-next-line @foxglove/no-boolean-parameters
  setMenuOpen: (_: boolean) => void;
  showControls?: boolean;
};

const Root = muiStyled("div")<{ shouldShow: boolean }>(({ shouldShow }) => ({
  display: "flex",
  visibility: shouldShow ? "visible" : "hidden",
  flex: "0 0 auto",
  alignItems: "center",
  flexDirection: "row",
}));

// Keep controls, which don't change often, in a pure component in order to avoid re-rendering the
// whole PanelToolbar when only children change.
export const PanelToolbarControls = React.memo(function PanelToolbarControls({
  additionalIcons,
  isUnknownPanel,
  menuOpen,
  mousePresent = false,
  setMenuOpen,
  showControls = false,
}: PanelToolbarControlsProps) {
  const panelContext = useContext(PanelContext);

  return (
    <Root shouldShow={showControls ? true : mousePresent}>
      {additionalIcons}
      <PanelActionsDropdown
        isOpen={menuOpen}
        setIsOpen={setMenuOpen}
        isUnknownPanel={isUnknownPanel}
      />
      {!isUnknownPanel && panelContext?.connectToolbarDragHandle && (
        <span ref={panelContext.connectToolbarDragHandle} data-test="mosaic-drag-handle">
          <ToolbarIconButton title="Move panel (shortcut: ` or ~)" style={{ cursor: "grab" }}>
            <DragIndicatorIcon color="disabled" />
          </ToolbarIconButton>
        </span>
      )}
    </Root>
  );
});
