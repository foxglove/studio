// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Typography, styled as muiStyled, SvgIcon } from "@mui/material";
import { ReactElement, useEffect, useRef, useState } from "react";
import Tree from "react-json-tree";

import ExpandingToolbar, {
  ToolGroup,
  ToolGroupFixedSizePane,
} from "@foxglove/studio-base/components/ExpandingToolbar";
import { PANEL_TOOLBAR_MIN_HEIGHT } from "@foxglove/studio-base/components/PanelToolbar";
import Stack from "@foxglove/studio-base/components/Stack";
import { usePanelMousePresence } from "@foxglove/studio-base/hooks/usePanelMousePresence";
import { useJsonTreeTheme } from "@foxglove/studio-base/util/globalConstants";

import { PixelData } from "../types";

const ToolbarRoot = muiStyled("div", {
  shouldForwardProp: (prop) => prop !== "visible",
})<{
  visible: boolean;
}>(({ visible, theme }) => ({
  displauy: "flex",
  flexDirection: "column",
  position: "absolute",
  top: 0,
  right: 0,
  marginRight: theme.spacing(0.75),
  marginTop: `calc(${theme.spacing(0.75)} + ${PANEL_TOOLBAR_MIN_HEIGHT}px)`,
  zIndex: theme.zIndex.tooltip,
  visibility: visible ? "visible" : "hidden",
}));

enum TabName {
  SELECTED_POINT = "Selected Point",
}

function ObjectPane({ pixelData }: { pixelData: PixelData | undefined }): ReactElement {
  const jsonTreeTheme = useJsonTreeTheme();

  return (
    <Stack gap={1}>
      <div>
        <Typography variant="caption">Position:</Typography>
        <Stack direction="row" gap={1}>
          <Typography color="info.main" variant="body2">
            X:{pixelData?.position.x}
          </Typography>
          <Typography color="info.main" variant="body2">
            Y:{pixelData?.position.y}
          </Typography>
        </Stack>
      </div>
      <div>
        <Typography variant="caption">Color:</Typography>
        <Stack direction="row" gap={1}>
          <Typography color="info.main" variant="body2">
            R:{pixelData?.color.r}
          </Typography>
          <Typography color="info.main" variant="body2">
            G:{pixelData?.color.g}
          </Typography>
          <Typography color="info.main" variant="body2">
            B:{pixelData?.color.b}
          </Typography>
          <Typography color="info.main" variant="body2">
            A:{pixelData?.color.a}
          </Typography>
        </Stack>
      </div>
      {pixelData?.marker && (
        <div>
          <Typography variant="caption">Marker:</Typography>
          <Tree
            data={pixelData.marker}
            hideRoot
            invertTheme={false}
            theme={{ ...jsonTreeTheme, tree: { margin: 0 } }}
          />
        </div>
      )}
    </Stack>
  );
}

export function Toolbar({ pixelData }: { pixelData: PixelData | undefined }): JSX.Element {
  const ref = useRef<HTMLDivElement>(ReactNull);
  const [selectedTab, setSelectedTab] = useState<TabName | undefined>();

  useEffect(() => {
    if (pixelData) {
      setSelectedTab(TabName.SELECTED_POINT);
    } else {
      setSelectedTab(undefined);
    }
  }, [pixelData]);

  const mousePresent = usePanelMousePresence(ref);

  return (
    <ToolbarRoot ref={ref} visible={mousePresent}>
      <ExpandingToolbar
        tooltip="Inspect objects"
        icon={
          <SvgIcon>
            <path
              d="M13.64,21.97C13.14,22.21 12.54,22 12.31,21.5L10.13,16.76L7.62,18.78C7.45,18.92 7.24,19 7,19A1,1 0 0,1 6,18V3A1,1 0 0,1 7,2C7.24,2 7.47,2.09 7.64,2.23L7.65,2.22L19.14,11.86C19.57,12.22 19.62,12.85 19.27,13.27C19.12,13.45 18.91,13.57 18.7,13.61L15.54,14.23L17.74,18.96C18,19.46 17.76,20.05 17.26,20.28L13.64,21.97Z"
              fill="currentColor"
            />
          </SvgIcon>
        }
        selectedTab={selectedTab}
        onSelectTab={setSelectedTab}
      >
        <ToolGroup name={TabName.SELECTED_POINT}>
          <ToolGroupFixedSizePane>
            {pixelData ? (
              <ObjectPane pixelData={pixelData} />
            ) : (
              <Typography color="secondary.main">Click an object to select it.</Typography>
            )}
          </ToolGroupFixedSizePane>
        </ToolGroup>
      </ExpandingToolbar>
    </ToolbarRoot>
  );
}
