// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { clamp } from "lodash";
import { makeStyles } from "tss-react/mui";

import {
  TimelinePositionedEvent,
  useTimelinePositionedEvents,
} from "@foxglove/studio-base/hooks/useTimelinePositionedEvents";

const useStyles = makeStyles()((theme) => ({
  root: {
    inset: 0,
    pointerEvents: "none",
    position: "absolute",
  },

  tick: {
    backgroundColor: theme.palette.primary.main,
    borderRadius: 2,
    bottom: 6,
    opacity: 0.5,
    position: "absolute",
    top: 6,
  },
}));

function EventTick({ event }: { event: TimelinePositionedEvent }): JSX.Element {
  const { classes } = useStyles();

  const left = `calc(${clamp(event.startPosition, 0, 1) * 100}% - 1px)`;
  const right = `calc(100% - ${clamp(event.endPosition, 0, 1) * 100}% - 1px)`;

  return <div className={classes.tick} style={{ left, right }}></div>;
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
