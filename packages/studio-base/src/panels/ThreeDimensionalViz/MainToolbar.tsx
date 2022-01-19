// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import RulerIcon from "@mdi/svg/svg/ruler.svg";
import Video3dIcon from "@mdi/svg/svg/video-3d.svg";
import AddLocationIcon from "@mui/icons-material/AddLocation";
import BugReportIcon from "@mui/icons-material/BugReport";
import CheckIcon from "@mui/icons-material/Check";
import FlagIcon from "@mui/icons-material/Flag";
import GoalIcon from "@mui/icons-material/SportsScore";
import {
  Box,
  IconButton,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { ReactNode, useCallback, useRef, useState } from "react";
import { useLongPress } from "react-use";

import {
  MessagePipelineContext,
  useMessagePipeline,
} from "@foxglove/studio-base/components/MessagePipeline";
import {
  InteractionStateProps,
  PublishClickType,
} from "@foxglove/studio-base/panels/ThreeDimensionalViz/InteractionState";
import { PlayerCapabilities } from "@foxglove/studio-base/players/types";

type Props = InteractionStateProps & {
  debug: boolean;
  onToggleCameraMode: () => void;
  onToggleDebug: () => void;
  perspective: boolean;
};

const PublishClickIcons: Record<PublishClickType, ReactNode> = {
  goal: <GoalIcon />,
  point: <AddLocationIcon />,
  pose: <FlagIcon />,
};

const canPublishSelector = (context: MessagePipelineContext) =>
  context.playerState.capabilities.includes(PlayerCapabilities.advertise);

function MainToolbar({
  debug,
  interactionState,
  interactionStateDispatch: dispatch,
  onToggleCameraMode,
  onToggleDebug,
  perspective = false,
}: Props) {
  const canPublish = useMessagePipeline(canPublishSelector);

  const [clickMenuExpanded, setClickMenuExpanded] = useState(false);
  const [activePublishClickType, setActivePublishClickType] = useState<PublishClickType>("point");
  const publickClickButtonRef = useRef<HTMLElement>(ReactNull);

  const onLongPress = useCallback(() => {
    setClickMenuExpanded(true);
  }, []);
  const longPressEvent = useLongPress(onLongPress);

  const selectedPublishClickIconName = PublishClickIcons[activePublishClickType];

  const selectPublishClickToolType = (type: PublishClickType) => {
    setActivePublishClickType(type);
    setClickMenuExpanded(false);
    dispatch({ action: "select-tool", tool: "publish-click", type });
  };

  const selectPublishClickTool = () => {
    if (!clickMenuExpanded) {
      dispatch({ action: "select-tool", tool: "publish-click", type: activePublishClickType });
    }
  };

  return (
    <Paper square={false} sx={{ pointerEvents: "auto" }}>
      <Stack alignItems="flex-end" flexGrow={0} flexShrink={0}>
        <IconButton
          title={perspective ? "Switch to 2D camera" : "Switch to 3D camera"}
          data-text="MainToolbar-toggleCameraMode"
          sx={{ color: perspective ? "info.main" : "inherit" }}
          onClick={onToggleCameraMode}
        >
          <Video3dIcon />
        </IconButton>
        <IconButton
          title={
            perspective
              ? "Switch to 2D camera to measure distance"
              : interactionState.tool.name === "measure"
              ? "Cancel measuring"
              : "Measure distance"
          }
          disabled={perspective}
          onClick={() => dispatch({ action: "select-tool", tool: "measure" })}
          sx={{
            color:
              !perspective && interactionState.tool.name === "measure" ? "info.main" : "inherit",
            position: "relative",
          }}
        >
          {interactionState.measure?.distance != undefined && (
            <Typography
              sx={{
                color: "white",
                left: -6,
                fontSize: 12,
                position: "absolute",
                top: "50%",
                transform: "translate(-100%, -50%)",
              }}
            >
              {interactionState.measure.distance.toFixed(2)}m
            </Typography>
          )}
          <RulerIcon />
        </IconButton>

        {canPublish && (
          <Stack direction="row" position="relative">
            <IconButton
              {...longPressEvent}
              title={
                interactionState.tool.name === "publish-click"
                  ? "Click to cancel"
                  : "Click to publish"
              }
              ref={(r) => (publickClickButtonRef.current = r)}
              onClick={selectPublishClickTool}
              id="publish-button"
              aria-controls={clickMenuExpanded ? "publish-menu" : undefined}
              aria-haspopup="true"
              aria-expanded={clickMenuExpanded ? "true" : undefined}
              disabled={perspective}
              sx={(theme) => ({
                position: "relative",
                color:
                  !perspective && interactionState.tool.name === "publish-click"
                    ? "info.main"
                    : "inherit",

                "&:after": {
                  content: perspective ? "none" : "''",
                  borderBottom: `6px solid ${
                    perspective ? theme.palette.text.disabled : theme.palette.text.primary
                  }`,
                  borderRight: "6px solid transparent",
                  bottom: 0,
                  left: 0,
                  height: 0,
                  width: 0,
                  margin: 0.25,
                  position: "absolute",
                },
              })}
            >
              {selectedPublishClickIconName}
            </IconButton>
            <Menu
              id="publish-menu"
              anchorEl={publickClickButtonRef.current}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "left",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              sx={{ transform: "translateY(-8px) translateX(-4px)" }}
              open={clickMenuExpanded}
              onClose={() => setClickMenuExpanded(false)}
              MenuListProps={{
                "aria-labelledby": "publish-button",
              }}
            >
              <MenuItem
                selected={activePublishClickType === "pose"}
                onClick={() => selectPublishClickToolType("pose")}
              >
                <FlagIcon />
                <ListItemText
                  primary="Publish pose estimate"
                  primaryTypographyProps={{ variant: "body2" }}
                  sx={{ marginX: 1 }}
                />
                {activePublishClickType === "pose" ? <CheckIcon /> : <Box width={20} height={20} />}
              </MenuItem>
              <MenuItem
                selected={activePublishClickType === "goal"}
                onClick={() => selectPublishClickToolType("goal")}
              >
                <GoalIcon />
                <ListItemText
                  primary="Publish goal"
                  primaryTypographyProps={{ variant: "body2" }}
                  sx={{ marginX: 1 }}
                />
                {activePublishClickType === "goal" ? <CheckIcon /> : <Box width={20} height={20} />}
              </MenuItem>
              <MenuItem
                selected={activePublishClickType === "point"}
                onClick={() => selectPublishClickToolType("point")}
              >
                <AddLocationIcon />
                <ListItemText
                  primary="Publish point"
                  primaryTypographyProps={{ variant: "body2" }}
                  sx={{ marginX: 1 }}
                />
                {activePublishClickType === "point" ? (
                  <CheckIcon />
                ) : (
                  <Box width={20} height={20} />
                )}
              </MenuItem>
            </Menu>
          </Stack>
        )}

        {process.env.NODE_ENV === "development" && (
          <IconButton
            title={debug ? "Disable debug" : "Enable debug"}
            sx={{ color: debug ? "info.main" : "inherit" }}
            onClick={onToggleDebug}
          >
            <BugReportIcon />
          </IconButton>
        )}
      </Stack>
    </Paper>
  );
}

export default React.memo<Props>(MainToolbar);
