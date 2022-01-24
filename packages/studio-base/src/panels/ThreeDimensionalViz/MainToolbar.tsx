// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { IconButton, IButtonStyles, Stack, useTheme } from "@fluentui/react";
import { styled as mstyled } from "@mui/system";
import cx from "classnames";
import { useCallback, useState } from "react";
import { ReactElement } from "react-markdown/lib/react-markdown";
import { useLongPress } from "react-use";

import { useTooltip } from "@foxglove/studio-base/components/Tooltip";
import {
  InteractionStateProps,
  PublishClickType,
} from "@foxglove/studio-base/panels/ThreeDimensionalViz/InteractionState";
import { colors } from "@foxglove/studio-base/util/sharedStyleConstants";

type Props = InteractionStateProps & {
  debug: boolean;
  onToggleCameraMode: () => void;
  onToggleDebug: () => void;
  perspective: boolean;
};

const PublishClickIcons: Record<PublishClickType, RegisteredIconNames> = {
  goal: "ArrowCollapseUp",
  point: "MapMarker",
  pose: "ArrowExpandUp",
};

const ClickToolSubmenu = mstyled("div")`
display: flex;
transform: translateX(100%);
transition: transform 80ms;

&.open {
  transform: translateX(0);
}
`;

function ExpansionIndicator(): ReactElement {
  return (
    <span
      style={{
        borderBottom: "6px solid white",
        borderRight: "6px solid transparent",
        bottom: 0,
        height: 0,
        left: 0,
        position: "absolute",
        width: 0,
      }}
    />
  );
}

function MainToolbar({
  debug,
  interactionState,
  interactionStateDispatch: dispatch,
  onToggleCameraMode,
  onToggleDebug,
  perspective = false,
}: Props) {
  const theme = useTheme();
  const [clickMenuExpanded, setClickMenuExpanded] = useState(false);
  const [activePublishClickType, setActivePublishClickType] = useState<PublishClickType>("point");

  const onLongPress = useCallback(() => {
    setClickMenuExpanded(true);
  }, []);
  const longPressEvent = useLongPress(onLongPress);
  const toggleCameraButton = useTooltip({
    contents: perspective ? "Switch to 2D camera" : "Switch to 3D camera",
  });
  const measuringToolButton = useTooltip({
    contents: perspective
      ? "Switch to 2D camera to measure distance"
      : interactionState.tool.name === "measure"
      ? "Cancel measuring"
      : "Measure distance",
  });
  const publishGoalToolButton = useTooltip({
    contents:
      interactionState.publish?.type === "goal"
        ? "Cancel goal publishing"
        : "Click to publish goal",
  });
  const publishPoseToolButton = useTooltip({
    contents:
      interactionState.publish?.type === "pose"
        ? "Cancel pose publishing"
        : "Click to publish pose",
  });
  const publishPointToolButton = useTooltip({
    contents:
      interactionState.publish?.type === "point"
        ? "Cancel point publishing"
        : "Click to publish point",
  });
  const debugButton = useTooltip({
    contents: debug ? "Disable debug" : "Enable debug",
  });

  const iconButtonStyles: Partial<IButtonStyles> = {
    root: {
      backgroundColor: theme.semanticColors.buttonBackgroundHovered,
      borderRadius: 0,
    },
    rootHovered: {
      backgroundColor: theme.semanticColors.buttonBackgroundHovered,
    },
    rootPressed: {
      backgroundColor: theme.semanticColors.buttonBackgroundHovered,
    },
    rootDisabled: {
      backgroundColor: theme.semanticColors.buttonBackgroundHovered,
    },
    rootChecked: {
      backgroundColor: theme.semanticColors.buttonBackgroundHovered,
    },
    rootCheckedHovered: {
      backgroundColor: theme.semanticColors.buttonBackgroundHovered,
    },
    rootCheckedPressed: {
      backgroundColor: theme.semanticColors.buttonBackgroundHovered,
    },

    iconChecked: { color: colors.HIGHLIGHT },
    icon: {
      color: theme.semanticColors.bodyText,
      svg: {
        fill: "currentColor",
        height: "1em",
        width: "1em",
      },
    },
  };

  const selectedPublishClickIconName = PublishClickIcons[activePublishClickType];

  function selectPublishClickToolType(type: PublishClickType) {
    setActivePublishClickType(type);
    setClickMenuExpanded(false);
  }

  function selectPublishClickTool() {
    if (!clickMenuExpanded) {
      dispatch({
        action: "select-tool",
        tool: "publish-click",
        type: activePublishClickType,
      });
    }
  }

  return (
    <Stack
      grow={0}
      styles={{
        root: {
          alignItems: "flex-end",
          borderRadius: theme.effects.roundedCorner2,
          flexShrink: 0,
          pointerEvents: "auto",
        },
      }}
    >
      {toggleCameraButton.tooltip}
      <IconButton
        checked={perspective}
        onClick={onToggleCameraMode}
        elementRef={toggleCameraButton.ref}
        data-text="MainToolbar-toggleCameraMode"
        iconProps={{ iconName: "Video3d" }}
        styles={iconButtonStyles}
      />
      {measuringToolButton.tooltip}
      <IconButton
        checked={interactionState.tool.name === "measure"}
        disabled={perspective}
        onClick={() => dispatch({ action: "select-tool", tool: "measure" })}
        elementRef={measuringToolButton.ref}
        iconProps={{ iconName: "Ruler" }}
        styles={iconButtonStyles}
      />
      <Stack horizontal style={{ overflow: "hidden", position: "relative" }}>
        <ClickToolSubmenu className={cx({ open: clickMenuExpanded })}>
          {publishPoseToolButton.tooltip}
          <IconButton
            onClick={() => selectPublishClickToolType("pose")}
            elementRef={publishPoseToolButton.ref}
            iconProps={{ iconName: "ArrowExpandUp" }}
            styles={iconButtonStyles}
          />
          {publishGoalToolButton.tooltip}
          <IconButton
            onClick={() => selectPublishClickToolType("goal")}
            elementRef={publishGoalToolButton.ref}
            iconProps={{ iconName: "ArrowCollapseUp" }}
            styles={iconButtonStyles}
          />
          {publishPointToolButton.tooltip}
          <IconButton
            onClick={() => selectPublishClickToolType("point")}
            elementRef={publishPointToolButton.ref}
            iconProps={{ iconName: "MapMarker" }}
            styles={iconButtonStyles}
          />
          <ExpansionIndicator />
        </ClickToolSubmenu>
        <div style={{ position: "relative" }}>
          <IconButton
            {...longPressEvent}
            checked={interactionState.tool.name === "publish-click"}
            disabled={perspective}
            iconProps={{ iconName: selectedPublishClickIconName }}
            onClick={selectPublishClickTool}
            styles={iconButtonStyles}
          />
          {!clickMenuExpanded && <ExpansionIndicator />}
        </div>
      </Stack>
      {process.env.NODE_ENV === "development" && (
        <>
          {debugButton.tooltip}
          <IconButton
            checked={debug}
            onClick={onToggleDebug}
            elementRef={debugButton.ref}
            iconProps={{ iconName: "Bug" }}
            styles={iconButtonStyles}
          />
        </>
      )}
    </Stack>
  );
}

export default React.memo<Props>(MainToolbar);
