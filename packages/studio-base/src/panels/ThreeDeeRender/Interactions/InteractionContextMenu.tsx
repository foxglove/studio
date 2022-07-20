// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { ListItemText, Menu, MenuItem } from "@mui/material";
import { useCallback } from "react";

import { getObject } from "@foxglove/studio-base/panels/ThreeDimensionalViz/threeDimensionalVizUtils";
import { BaseMarker } from "@foxglove/studio-base/types/Messages";

import { MouseEventObject } from "../camera";
import { Interactive, SelectedObject } from "./types";

type ClickedPosition = { clientX: number; clientY: number };

type Props = {
  clickedPosition: ClickedPosition;
  clickedObjects: MouseEventObject[];
  selectObject: (arg0?: MouseEventObject) => void;
};

function InteractionContextMenuItem({
  interactiveObject,
  selectObject,
}: {
  selectObject: (arg0?: SelectedObject) => void;
  interactiveObject?: MouseEventObject;
}): JSX.Element {
  const object = getObject(interactiveObject) as Partial<Interactive<BaseMarker>>;
  const menuText = <>{object.interactionData?.topic}</>;

  const selectItemObject = useCallback(
    () => selectObject(interactiveObject as SelectedObject),
    [interactiveObject, selectObject],
  );

  return (
    <MenuItem data-testid="InteractionContextMenuItem" onClick={selectItemObject}>
      <ListItemText
        primary={menuText}
        primaryTypographyProps={{
          noWrap: true,
        }}
      />
    </MenuItem>
  );
}

export default function InteractionContextMenu({
  clickedObjects = [],
  clickedPosition = { clientX: 0, clientY: 0 },
  selectObject,
}: Props): JSX.Element {
  return (
    <Menu
      open
      anchorReference="anchorPosition"
      anchorPosition={{
        top: clickedPosition.clientY,
        left: clickedPosition.clientX,
      }}
      MenuListProps={{
        dense: true,
      }}
    >
      {clickedObjects.map((interactiveObject, index) => (
        <InteractionContextMenuItem
          key={index}
          interactiveObject={interactiveObject}
          selectObject={selectObject}
        />
      ))}
    </Menu>
  );
}
