// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { clamp } from "lodash";
import { makeStyles } from "tss-react/mui";

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
    transition: transitions.create("height", {
      duration: transitions.duration.shorter,
    }),
    backgroundBlendMode: "overlay",
    backgroundColor: palette.info.main,
    opacity: 0.6,
    position: "absolute",
    height: 6,
  },
  tickHovered: {
    transition: transitions.create("height", { duration: transitions.duration.shorter }),
    height: 12,
  },
}));

const selectHoveredEvent = (store: TimelineInteractionStateStore) => store.hoveredEvent;

function EventTick({ event }: { event: TimelinePositionedEvent }): JSX.Element {
  const hoveredEvent = useTimelineInteractionState(selectHoveredEvent);
  const { classes, cx } = useStyles();

  const left = `calc(${clamp(event.startPosition, 0, 1) * 100}% - 1px)`;
  const right = `calc(100% - ${clamp(event.endPosition, 0, 1) * 100}% - 1px)`;

  return (
    <div
      className={cx(classes.tick, {
        [classes.tickHovered]: hoveredEvent?.id === event.event.id,
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
