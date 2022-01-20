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

import { makeStyles } from "@fluentui/react";
import { Link, Stack, Typography } from "@mui/material";
import cx from "classnames";
import { useCallback } from "react";
import { useDrop } from "react-dnd";
import { MosaicDragType } from "react-mosaic-component";

import PanelList, { PanelSelection } from "@foxglove/studio-base/components/PanelList";
import { useCurrentLayoutActions } from "@foxglove/studio-base/context/CurrentLayoutContext";
import { MosaicDropResult } from "@foxglove/studio-base/types/panels";
import { getPanelIdForType } from "@foxglove/studio-base/util/layout";

const useStyles = makeStyles((theme) => ({
  dropzone: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
    width: "100%",
    height: "100%",
    border: "1px solid transparent",
  },
  dropzoneOver: {
    backgroundColor: theme.palette.neutralLighterAlt,
    borderColor: theme.palette.neutralLight,
  },
}));

type Props = {
  tabId?: string;
};

export const EmptyPanelLayout = ({ tabId }: Props): JSX.Element => {
  const classes = useStyles();
  const { addPanel } = useCurrentLayoutActions();

  const [{ isOver }, drop] = useDrop<unknown, MosaicDropResult, { isOver: boolean }>({
    accept: MosaicDragType.WINDOW,
    drop: () => {
      return { tabId };
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const onPanelSelect = useCallback(
    ({ type, config, relatedConfigs }: PanelSelection) => {
      const id = getPanelIdForType(type);
      addPanel({ tabId, id, config, relatedConfigs });
    },
    [addPanel, tabId],
  );

  return (
    <div
      ref={drop}
      data-test="empty-drop-target"
      className={cx(classes.dropzone, {
        [classes.dropzoneOver]: isOver,
      })}
    >
      <Stack
        sx={{
          width: "100%",
          height: "100%",
          overflowY: "auto",
        }}
      >
        <Stack sx={{ paddingBottom: (theme) => theme.spacing(2) }}>
          <Typography sx={{ paddingX: (theme) => theme.spacing(2) }}>
            Select a panel below to add it to your layout.{" "}
            <Link target="_blank" href="https://foxglove.dev/docs/app-concepts/layouts">
              Learn more
            </Link>
          </Typography>
          <PanelList mode="grid" onPanelSelect={onPanelSelect} />
        </Stack>
      </Stack>
    </div>
  );
};
