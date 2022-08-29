// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useMemo } from "react";

import { scaleValue as scale } from "@foxglove/den/math";
import { toSec } from "@foxglove/rostime";
import {
  MessagePipelineContext,
  useMessagePipeline,
} from "@foxglove/studio-base/components/MessagePipeline";
import { EventsStore, useEvents } from "@foxglove/studio-base/context/EventsContext";
import { ConsoleEvent } from "@foxglove/studio-base/services/ConsoleApi";

const selectStartTime = (ctx: MessagePipelineContext) => ctx.playerState.activeData?.startTime;
const selectEndTime = (ctx: MessagePipelineContext) => ctx.playerState.activeData?.endTime;
const selectEvents = (store: EventsStore) => store.events;

/**
 * Represents an event including its fractional position on the timeline.
 */
export type TimelinePositionedEvent = {
  /** The event. */
  event: ConsoleEvent;

  /** The end position of the event, as a value 0-1 relative to the timeline. */
  endPosition: number;

  /** The start position of the event, as a value 0-1 relative to the timeline. */
  startPosition: number;
};

/**
 * Returns events including positioning information within the session start and end time.
 */
export function useTimelinePositionedEvents(): undefined | TimelinePositionedEvent[] {
  const { value: events } = useEvents(selectEvents);
  const startTime = useMessagePipeline(selectStartTime);
  const endTime = useMessagePipeline(selectEndTime);

  const startSecs = useMemo(() => (startTime ? toSec(startTime) : undefined), [startTime]);
  const endSecs = useMemo(() => (endTime ? toSec(endTime) : undefined), [endTime]);

  const timelineEvents: undefined | TimelinePositionedEvent[] = useMemo(() => {
    if (events == undefined || startSecs == undefined || endSecs == undefined) {
      return undefined;
    }

    return events.map((event) => {
      const startPosition = scale(event.startTimeInSeconds, startSecs, endSecs, 0, 1);
      const endPosition = scale(event.endTimeInSeconds, startSecs, endSecs, 0, 1);
      return { event, endPosition, startPosition, time: event.startTimeInSeconds };
    });
  }, [endSecs, events, startSecs]);

  return timelineEvents;
}
