// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Divider, Tooltip, Typography } from "@mui/material";
import { Instance } from "@popperjs/core";
import { isEmpty } from "lodash";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLatest } from "react-use";
import { makeStyles } from "tss-react/mui";
import { v4 as uuidv4 } from "uuid";

import { subtract as subtractTimes, toSec, fromSec, Time } from "@foxglove/rostime";
import {
  MessagePipelineContext,
  useMessagePipeline,
} from "@foxglove/studio-base/components/MessagePipeline";
import Stack from "@foxglove/studio-base/components/Stack";
import {
  TimelineInteractionStateStore,
  useClearHoverValue,
  useSetHoverValue,
  useTimelineInteractionState,
} from "@foxglove/studio-base/context/TimelineInteractionStateContext";
import { useAppTimeFormat } from "@foxglove/studio-base/hooks";
import { PlayerPresence } from "@foxglove/studio-base/players/types";
import { fonts } from "@foxglove/studio-base/util/sharedStyleConstants";

import { EventsOverlay } from "./EventsOverlay";
import PlaybackBarHoverTicks from "./PlaybackBarHoverTicks";
import { ProgressPlot } from "./ProgressPlot";
import Slider from "./Slider";

const useStyles = makeStyles()((theme) => ({
  tooltipDivider: {
    gridColumn: "span 2",
    marginBlock: theme.spacing(0.5),
    opacity: 0.5,
  },
  tooltipWrapper: {
    fontFeatureSettings: `${fonts.SANS_SERIF_FEATURE_SETTINGS}, "zero"`,
    fontFamily: fonts.SANS_SERIF,
    whiteSpace: "nowrap",
    columnGap: theme.spacing(0.5),
    display: "grid",
    alignItems: "center",
    gridTemplateColumns: "auto 1fr",
    flexDirection: "column",
  },
  itemKey: {
    fontSize: "0.7rem",
    opacity: 0.7,
    textAlign: "end",
    textTransform: "lowercase",
  },
  marker: {
    backgroundColor: theme.palette.text.primary,
    position: "absolute",
    height: 16,
    borderRadius: 1,
    width: 2,
    transform: "translate(-50%, 0)",
  },
  track: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: theme.palette.action.focus,
  },
  trackDisabled: {
    opacity: theme.palette.action.disabledOpacity,
  },
}));

const selectHoveredEvents = (store: TimelineInteractionStateStore) => store.eventsAtHoverValue;
const selectStartTime = (ctx: MessagePipelineContext) => ctx.playerState.activeData?.startTime;
const selectCurrentTime = (ctx: MessagePipelineContext) => ctx.playerState.activeData?.currentTime;
const selectEndTime = (ctx: MessagePipelineContext) => ctx.playerState.activeData?.endTime;
const selectRanges = (ctx: MessagePipelineContext) =>
  ctx.playerState.progress.fullyLoadedFractionRanges;
const selectPresence = (ctx: MessagePipelineContext) => ctx.playerState.presence;

type Props = {
  onSeek: (seekTo: Time) => void;
};

type TooltipItem = { type: "divider" } | { type: "item"; title: string; value: string };

export default function Scrubber(props: Props): JSX.Element {
  const { onSeek } = props;
  const { classes, cx } = useStyles();

  const [hoverComponentId] = useState<string>(() => uuidv4());
  const el = useRef<HTMLDivElement>(ReactNull);

  const { formatTime, timeFormat } = useAppTimeFormat();

  const startTime = useMessagePipeline(selectStartTime);
  const currentTime = useMessagePipeline(selectCurrentTime);
  const endTime = useMessagePipeline(selectEndTime);
  const presence = useMessagePipeline(selectPresence);
  const ranges = useMessagePipeline(selectRanges);
  const hoveredEvents = useTimelineInteractionState(selectHoveredEvents);

  const setHoverValue = useSetHoverValue();

  const [hoverX, setHoverX] = useState<undefined | number>();

  const onChange = useCallback((value: number) => onSeek(fromSec(value)), [onSeek]);

  const latestStartTime = useLatest(startTime);
  const onHoverOver = useCallback(
    (x: number, value: number) => {
      if (!latestStartTime.current || el.current == undefined) {
        return;
      }
      const stamp = fromSec(value);
      const timeFromStart = subtractTimes(stamp, latestStartTime.current);
      setHoverX(value);
      setHoverValue({
        componentId: hoverComponentId,
        type: "PLAYBACK_SECONDS",
        value: toSec(timeFromStart),
      });
    },
    [hoverComponentId, latestStartTime, setHoverValue],
  );

  const clearHoverValue = useClearHoverValue();

  const onHoverOut = useCallback(() => {
    clearHoverValue(hoverComponentId);
  }, [clearHoverValue, hoverComponentId]);

  const tooltip = useMemo(() => {
    if (!latestStartTime.current || el.current == undefined || hoverX == undefined) {
      return;
    }
    const stamp = fromSec(hoverX);
    const timeFromStart = subtractTimes(stamp, latestStartTime.current);

    const tooltipItems: TooltipItem[] = [];

    if (!isEmpty(hoveredEvents)) {
      Object.values(hoveredEvents).forEach(({ event }) => {
        tooltipItems.push({
          type: "item",
          title: "Start",
          value: formatTime(event.startTime),
        });
        tooltipItems.push({
          type: "item",
          title: "End",
          value: formatTime(event.endTime),
        });
        if (!isEmpty(event.metadata)) {
          Object.entries(event.metadata).forEach(([metaKey, metaValue]) => {
            tooltipItems.push({ type: "item", title: metaKey, value: metaValue });
          });
        }
        tooltipItems.push({ type: "divider" });
      });
    }

    switch (timeFormat) {
      case "TOD":
        tooltipItems.push({ type: "item", title: "Time", value: formatTime(stamp) });
        break;
      case "SEC":
        tooltipItems.push({ type: "item", title: "SEC", value: formatTime(stamp) });
        break;
    }

    tooltipItems.push({
      type: "item",
      title: "Elapsed",
      value: `${toSec(timeFromStart).toFixed(9)} sec`,
    });

    return (
      <div className={classes.tooltipWrapper}>
        {tooltipItems.map((item, idx) => {
          if (item.type === "divider") {
            return <Divider key={`divider_${idx}`} className={classes.tooltipDivider} />;
          }
          return (
            <Fragment key={`${item.title}_${idx}`}>
              <Typography className={classes.itemKey}>{item.title}</Typography>
              <Typography variant="subtitle2">{item.value}</Typography>
            </Fragment>
          );
        })}
      </div>
    );
  }, [classes, formatTime, hoveredEvents, latestStartTime, timeFormat, hoverX]);

  // Clean up the hover value when we are unmounted -- important for storybook.
  useEffect(() => onHoverOut, [onHoverOut]);

  const renderSlider = useCallback(
    (val?: number) => {
      if (val == undefined) {
        return undefined;
      }
      return <div className={classes.marker} style={{ left: `${val * 100}%` }} />;
    },
    [classes.marker],
  );

  const min = startTime && toSec(startTime);
  const max = endTime && toSec(endTime);
  const value = currentTime == undefined ? undefined : toSec(currentTime);
  const step = ((max ?? 100) - (min ?? 0)) / 500;

  const loading = presence === PlayerPresence.INITIALIZING || presence === PlayerPresence.BUFFERING;

  const popperRef = React.useRef<Instance>(ReactNull);

  const areaRef = useRef<HTMLDivElement>(ReactNull);
  const positionRef = React.useRef<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  const handleMouseMove = (event: React.MouseEvent) => {
    positionRef.current = { x: event.clientX, y: event.clientY };

    if (popperRef.current != undefined) {
      void popperRef.current.update();
    }
  };

  return (
    <Tooltip
      title={<>{tooltip}</>}
      placement="top"
      PopperProps={{
        popperRef,
        anchorEl: {
          getBoundingClientRect: () => {
            return new DOMRect(
              positionRef.current.x,
              areaRef.current!.getBoundingClientRect().y,
              0,
              0,
            );
          },
        },
      }}
    >
      <Stack
        direction="row"
        flexGrow={1}
        onMouseMove={handleMouseMove}
        alignItems="center"
        position="relative"
        style={{ height: 32 }}
      >
        <div className={cx(classes.track, { [classes.trackDisabled]: !startTime })} />
        <Stack ref={areaRef} position="absolute" flex="auto" fullWidth style={{ height: 6 }}>
          <ProgressPlot loading={loading} availableRanges={ranges} />
        </Stack>
        <Stack ref={el} fullHeight fullWidth position="absolute" flex={1}>
          <Slider
            min={min ?? 0}
            max={max ?? 100}
            disabled={min == undefined || max == undefined}
            step={step}
            value={value}
            onHoverOver={onHoverOver}
            onHoverOut={onHoverOut}
            onChange={onChange}
            renderSlider={renderSlider}
          />
        </Stack>
        <EventsOverlay />
        <PlaybackBarHoverTicks componentId={hoverComponentId} />
      </Stack>
    </Tooltip>
  );
}
