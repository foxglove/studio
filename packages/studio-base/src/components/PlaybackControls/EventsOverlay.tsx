// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { alpha } from "@mui/material";
import { clamp } from "lodash";
import { makeStyles } from "tss-react/mui";

import { EventsStore, useEvents } from "@foxglove/studio-base/context/EventsContext";
import {
  TimelineInteractionStateStore,
  useTimelineInteractionState,
} from "@foxglove/studio-base/context/TimelineInteractionStateContext";
import {
  TimelinePositionedEvent,
  useTimelinePositionedEvents,
} from "@foxglove/studio-base/hooks/useTimelinePositionedEvents";

const useStyles = makeStyles()(({ transitions, palette }) => ({
  root: {
    inset: 0,
    pointerEvents: "none",
    position: "absolute",
    display: "flex",
    alignItems: "center",
  },
  tick: {
    transition: transitions.create("height", { duration: transitions.duration.shortest }),
    backgroundBlendMode: "overlay",
    backgroundColor: alpha(palette.info.main, 0.58),
    position: "absolute",
    height: 6,
  },
  tickHovered: {
    transition: transitions.create("height", { duration: transitions.duration.shortest }),
    backgroundColor: alpha(palette.info.main, 0.58),
    border: `1px solid ${palette.info.main}`,
    height: 12,
  },
  tickSelected: {
    transition: transitions.create("height", {
      duration: transitions.duration.shortest,
    }),
    backgroundColor: alpha(palette.info.main, 0.67),
    height: 12,
  },
}));

const selectHoveredEvents = (store: TimelineInteractionStateStore) => store.hoveredEvents;
const selectSelectedEventId = (store: EventsStore) => store.selectedEventId;

function EventTick({ event }: { event: TimelinePositionedEvent }): JSX.Element {
  const hoveredEvents = useTimelineInteractionState(selectHoveredEvents);
  const selectedEventId = useEvents(selectSelectedEventId);
  const { classes, cx } = useStyles();

  const left = `calc(${clamp(event.startPosition, 0, 1) * 100}% - 1px)`;
  const right = `calc(100% - ${clamp(event.endPosition, 0, 1) * 100}% - 1px)`;

  return (
    <div
      className={cx(classes.tick, {
        [classes.tickHovered]: hoveredEvents[event.event.id] != undefined,
        [classes.tickSelected]: selectedEventId === event.event.id,
      })}
      style={{ left, right }}
    />
  );
}

const MemoEventTick = React.memo(EventTick);

export function EventsOverlay(): JSX.Element {
  const events = useTimelinePositionedEvents();
  const { classes } = useStyles();

  return (
    <div className={classes.root}>
      {(events ?? []).map((event) => (
        <MemoEventTick key={event.event.id} event={event} />
      ))}
    </div>
  );
}
