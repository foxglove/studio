// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import { alpha, AppBar, CircularProgress, IconButton, TextField, Typography } from "@mui/material";
import { compact } from "lodash";
import { Fragment, useCallback, useMemo } from "react";
import { makeStyles } from "tss-react/mui";

import { HighlightedText } from "@foxglove/studio-base/components/HighlightedText";
import {
  MessagePipelineContext,
  useMessagePipeline,
} from "@foxglove/studio-base/components/MessagePipeline";
import Stack from "@foxglove/studio-base/components/Stack";
import {
  EventsStore,
  TimelinePositionedEvent,
  useEvents,
} from "@foxglove/studio-base/context/EventsContext";
import {
  TimelineInteractionStateStore,
  useTimelineInteractionState,
} from "@foxglove/studio-base/context/TimelineInteractionStateContext";
import { useAppTimeFormat } from "@foxglove/studio-base/hooks";
import { EventsSelectors } from "@foxglove/studio-base/providers/EventsProvider";
import { ConsoleEvent } from "@foxglove/studio-base/services/ConsoleApi";

const useStyles = makeStyles<void, "eventMetadata" | "eventSelected">()(
  (theme, _params, classes) => ({
    appBar: {
      top: -1,
      zIndex: theme.zIndex.appBar - 1,
      display: "flex",
      flexDirection: "row",
      padding: theme.spacing(1),
      gap: theme.spacing(1),
      alignItems: "center",
      borderBottom: `1px solid ${theme.palette.divider}`,
    },
    grid: {
      display: "grid",
      flex: 1,
      gridTemplateColumns: "auto 1fr",
      overflowY: "auto",
      padding: theme.spacing(1),
    },
    root: {
      backgroundColor: theme.palette.background.paper,
      maxHeight: "100%",
    },
    spacer: {
      cursor: "default",
      height: theme.spacing(1),
      gridColumn: "span 2",
    },
    event: {
      display: "contents",
      cursor: "pointer",
      "&:hover": {
        [`.${classes.eventMetadata}`]: {
          backgroundColor: alpha(theme.palette.info.main, theme.palette.action.hoverOpacity),
          borderColor: theme.palette.info.main,
        },
      },
    },
    eventSelected: {
      [`.${classes.eventMetadata}`]: {
        backgroundColor: alpha(theme.palette.info.main, theme.palette.action.activatedOpacity),
        borderColor: theme.palette.info.main,
        boxShadow: `0 0 0 1px ${theme.palette.info.main}`,
      },
    },
    eventHovered: {
      [`.${classes.eventMetadata}`]: {
        backgroundColor: alpha(theme.palette.info.main, theme.palette.action.hoverOpacity),
        borderColor: theme.palette.info.main,
      },
    },
    eventMetadata: {
      padding: theme.spacing(1),
      backgroundColor: theme.palette.background.default,
      borderRight: `1px solid ${theme.palette.divider}`,
      borderBottom: `1px solid ${theme.palette.divider}`,

      "&:nth-of-type(odd)": {
        borderLeft: `1px solid ${theme.palette.divider}`,
      },
      "&:first-of-type": {
        borderTop: `1px solid ${theme.palette.divider}`,
        borderTopLeftRadius: theme.shape.borderRadius,
      },
      "&:nth-of-type(2)": {
        borderTop: `1px solid ${theme.palette.divider}`,
        borderTopRightRadius: theme.shape.borderRadius,
      },
      "&:nth-last-of-type(2)": {
        borderBottomRightRadius: theme.shape.borderRadius,
      },
      "&:nth-last-of-type(3)": {
        borderBottomLeftRadius: theme.shape.borderRadius,
      },
    },
  }),
);

function formatEventDuration(event: ConsoleEvent) {
  if (event.durationNanos === "0") {
    // instant
    return "-";
  }

  if (!event.durationNanos) {
    return "";
  }

  const intDuration = BigInt(event.durationNanos);

  if (intDuration >= BigInt(1e9)) {
    return `${Number(intDuration / BigInt(1e9))}s`;
  }

  if (intDuration >= BigInt(1e6)) {
    return `${Number(intDuration / BigInt(1e6))}ms`;
  }

  if (intDuration >= BigInt(1e3)) {
    return `${Number(intDuration / BigInt(1e3))}µs`;
  }

  return `${event.durationNanos}ns`;
}

const selectSeek = (ctx: MessagePipelineContext) => ctx.seekPlayback;

function EventView(params: {
  event: TimelinePositionedEvent;
  filter: string;
  formattedTime: string;
  isHovered: boolean;
  isSelected: boolean;
  onClick: (event: TimelinePositionedEvent) => void;
  onHoverStart: (event: TimelinePositionedEvent) => void;
  onHoverEnd: (event: TimelinePositionedEvent) => void;
}): JSX.Element {
  const { event, filter, formattedTime, isHovered, isSelected, onClick, onHoverStart, onHoverEnd } =
    params;
  const { classes, cx } = useStyles();

  const fields = compact([
    ["timestamp", formattedTime],
    Number(event.event.durationNanos) > 0 && ["duration", formatEventDuration(event.event)],
    ...Object.entries(event.event.metadata),
  ]);

  return (
    <div
      data-testid="sidebar-event"
      className={cx(classes.event, {
        [classes.eventSelected]: isSelected,
        [classes.eventHovered]: isHovered,
      })}
      onClick={() => onClick(event)}
      onMouseEnter={() => onHoverStart(event)}
      onMouseLeave={() => onHoverEnd(event)}
    >
      {fields.map(([key, value]) => (
        <Fragment key={key}>
          <div className={classes.eventMetadata}>
            <HighlightedText text={key ?? ""} highlight={filter} />
          </div>
          <div className={classes.eventMetadata}>
            <HighlightedText text={value ?? ""} highlight={filter} />
          </div>
        </Fragment>
      ))}
      <div className={classes.spacer} />
    </div>
  );
}

const MemoEventView = React.memo(EventView);

const selectEventFilter = (store: EventsStore) => store.filter;
const selectSetEventFilter = (store: EventsStore) => store.setFilter;
const selectEvents = (store: EventsStore) => store.events;
const selectHoveredEvent = (store: TimelineInteractionStateStore) => store.hoveredEvent;
const selectSetHoveredEvent = (store: TimelineInteractionStateStore) => store.setHoveredEvent;
const selectEventsAtHoverValue = (store: TimelineInteractionStateStore) => store.eventsAtHoverValue;
const selectSelectedEventId = (store: EventsStore) => store.selectedEventId;
const selectSelectEvent = (store: EventsStore) => store.selectEvent;

export function EventsList(): JSX.Element {
  const events = useEvents(selectEvents);
  const selectedEventId = useEvents(selectSelectedEventId);
  const selectEvent = useEvents(selectSelectEvent);
  const { formatTime } = useAppTimeFormat();
  const seek = useMessagePipeline(selectSeek);
  const eventsAtHoverValue = useTimelineInteractionState(selectEventsAtHoverValue);
  const hoveredEvent = useTimelineInteractionState(selectHoveredEvent);
  const setHoveredEvent = useTimelineInteractionState(selectSetHoveredEvent);
  const filter = useEvents(selectEventFilter);
  const setFilter = useEvents(selectSetEventFilter);
  const filteredEvents = useEvents(EventsSelectors.selectFilteredEvents);

  const timestampedEvents = useMemo(
    () =>
      filteredEvents.map((event) => {
        return { ...event, formattedTime: formatTime(event.event.startTime) };
      }),
    [filteredEvents, formatTime],
  );

  const clearFilter = useCallback(() => {
    setFilter("");
  }, [setFilter]);

  const onClick = useCallback(
    (event: TimelinePositionedEvent) => {
      if (event.event.id === selectedEventId) {
        selectEvent(undefined);
      } else {
        selectEvent(event.event.id);
      }

      if (seek) {
        seek(event.event.startTime);
      }
    },
    [seek, selectEvent, selectedEventId],
  );

  const onHoverEnd = useCallback(() => {
    setHoveredEvent(undefined);
  }, [setHoveredEvent]);

  const onHoverStart = useCallback(
    (event: TimelinePositionedEvent) => {
      setHoveredEvent(event);
    },
    [setHoveredEvent],
  );

  const { classes } = useStyles();

  if (events.loading) {
    return (
      <Stack flex="auto" padding={2} fullHeight alignItems="center" justifyContent="center">
        <CircularProgress />
      </Stack>
    );
  }

  if (events.error) {
    return (
      <Stack flex="auto" padding={2} fullHeight alignItems="center" justifyContent="center">
        <Typography align="center" color="error">
          Error loading events.
        </Typography>
      </Stack>
    );
  }

  if ((events.value ?? []).length === 0) {
    return (
      <Stack flex="auto" padding={2} fullHeight alignItems="center" justifyContent="center">
        <Typography align="center" color="text.secondary">
          No Events
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack className={classes.root}>
      <AppBar className={classes.appBar} position="sticky" color="inherit" elevation={0}>
        <TextField
          variant="filled"
          fullWidth
          value={filter}
          onChange={(event) => setFilter(event.currentTarget.value)}
          placeholder="Filter event metadata"
          InputProps={{
            startAdornment: <SearchIcon fontSize="small" />,
            endAdornment: filter !== "" && (
              <IconButton edge="end" onClick={clearFilter} size="small">
                <ClearIcon fontSize="small" />
              </IconButton>
            ),
          }}
        />
      </AppBar>
      <div className={classes.grid}>
        {timestampedEvents.map((event) => {
          return (
            <MemoEventView
              key={event.event.id}
              event={event}
              filter={filter}
              formattedTime={event.formattedTime}
              // When hovering within the event list only show hover state on directly
              // hovered event.
              isHovered={
                hoveredEvent
                  ? event.event.id === hoveredEvent.event.id
                  : eventsAtHoverValue[event.event.id] != undefined
              }
              isSelected={event.event.id === selectedEventId}
              onClick={onClick}
              onHoverStart={onHoverStart}
              onHoverEnd={onHoverEnd}
            />
          );
        })}
      </div>
    </Stack>
  );
}
