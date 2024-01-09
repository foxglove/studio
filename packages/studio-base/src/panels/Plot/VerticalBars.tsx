// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useEffect, useState } from "react";
import { makeStyles } from "tss-react/mui";

import { toSec } from "@foxglove/rostime";
import {
  MessagePipelineContext,
  useMessagePipeline,
} from "@foxglove/studio-base/components/MessagePipeline";
import { useHoverValue } from "@foxglove/studio-base/context/TimelineInteractionStateContext";

import type { Scale } from "./ChartRenderer";
import type { PlotCoordinator } from "./PlotCoordinator";

type Props = {
  coordinator?: PlotCoordinator;
  hoverComponentId: string;
  xAxisIsPlaybackTime: boolean;
};
const selectCurrentTimeSinceStart = ({ playerState: { activeData } }: MessagePipelineContext) =>
  activeData == undefined ? undefined : toSec(activeData.currentTime) - toSec(activeData.startTime);

const selectUndefined = () => undefined;

const useStyles = makeStyles()(() => ({
  verticalBar: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: 1,
    marginLeft: -1,
    display: "block",
    pointerEvents: "none",
  },
  playbackBar: {
    backgroundColor: "#aaa",
  },
}));

/** Get the canvas pixel x location for the plot x value */
function getPixelForXValue(
  scale: Scale | undefined,
  xValue: number | undefined,
): number | undefined {
  if (!scale || xValue == undefined) {
    return undefined;
  }

  const pixelRange = scale.right - scale.left;
  if (pixelRange <= 0) {
    return undefined;
  }

  if (xValue < scale.min || xValue > scale.max) {
    return undefined;
  }

  // Linear interpolation to place the xValue within min/max
  return scale.left + ((xValue - scale.min) / (scale.max - scale.min)) * pixelRange;
}

/**
 * Display vertical bars at the currentTime & the hovered time
 */
export const VerticalBars = React.memo(function VerticalBars({
  coordinator,
  hoverComponentId,
  xAxisIsPlaybackTime,
}: Props): JSX.Element {
  const { classes, cx, theme } = useStyles();

  // Only subscribe to currentTime for timeseries plots
  const currentTimeSinceStart = useMessagePipeline(
    xAxisIsPlaybackTime ? selectCurrentTimeSinceStart : selectUndefined,
  );

  const hoverValue = useHoverValue({
    componentId: hoverComponentId,
    isPlaybackSeconds: xAxisIsPlaybackTime,
  });

  const [xScale, setXScale] = useState<Scale | undefined>();
  useEffect(() => {
    if (!coordinator) {
      return;
    }
    const handler = (scale: Scale | undefined) => {
      setXScale(scale);
    };
    coordinator.on("xScaleChanged", handler);
    return () => {
      coordinator.off("xScaleChanged", handler);
    };
  }, [coordinator]);

  if (!coordinator) {
    return <></>;
  }

  const currentTimePixel = getPixelForXValue(xScale, currentTimeSinceStart);
  const hoverValuePixel = getPixelForXValue(xScale, hoverValue?.value);

  return (
    <>
      {currentTimePixel != undefined && (
        <div
          className={cx(classes.verticalBar, classes.playbackBar)}
          style={{
            transform: `translateX(${currentTimePixel}px)`,
          }}
        />
      )}
      {hoverValuePixel != undefined && (
        <div
          className={cx(classes.verticalBar)}
          style={{
            transform: `translateX(${hoverValuePixel}px)`,
            backgroundColor: xAxisIsPlaybackTime
              ? theme.palette.warning.main
              : theme.palette.info.main,
          }}
        />
      )}
    </>
  );
});
