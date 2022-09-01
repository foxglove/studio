// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useEffect, useMemo } from "react";
import { useAsync } from "react-use";

import { scaleValue as scale } from "@foxglove/den/math";
import Logger from "@foxglove/log";
import { subtract, toSec } from "@foxglove/rostime";
import {
  MessagePipelineContext,
  useMessagePipeline,
} from "@foxglove/studio-base/components/MessagePipeline";
import { useConsoleApi } from "@foxglove/studio-base/context/ConsoleApiContext";
import { useCurrentUser } from "@foxglove/studio-base/context/CurrentUserContext";
import { EventsStore, useEvents } from "@foxglove/studio-base/context/EventsContext";
import {
  TimelineInteractionStateStore,
  useHoverValue,
  useTimelineInteractionState,
} from "@foxglove/studio-base/context/TimelineInteractionStateContext";
import { useTimelinePositionedEvents } from "@foxglove/studio-base/hooks/useTimelinePositionedEvents";

const HOVER_TOLERANCE = 0.01;

const log = Logger.getLogger(__filename);

const selectUrlState = (ctx: MessagePipelineContext) => ctx.playerState.urlState;
const selectSetEvents = (store: EventsStore) => store.setEvents;
const selectSetHoveredEvents = (store: TimelineInteractionStateStore) => store.setHoveredEvents;
const selectStartTime = (ctx: MessagePipelineContext) => ctx.playerState.activeData?.startTime;
const selectEndTime = (ctx: MessagePipelineContext) => ctx.playerState.activeData?.endTime;

/**
 * Syncs events from server and syncs hovered event with hovered time.
 */
export function EventsSyncAdapter(): ReactNull {
  const { currentUser } = useCurrentUser();
  const urlState = useMessagePipeline(selectUrlState);
  const consoleApi = useConsoleApi();
  const setEvents = useEvents(selectSetEvents);
  const setHoveredEvents = useTimelineInteractionState(selectSetHoveredEvents);
  const hoverValue = useHoverValue();
  const startTime = useMessagePipeline(selectStartTime);
  const endTime = useMessagePipeline(selectEndTime);
  const timelineEvents = useTimelinePositionedEvents();

  const timeRange = useMemo(() => {
    if (!startTime || !endTime) {
      return undefined;
    }

    return toSec(subtract(endTime, startTime));
  }, [endTime, startTime]);

  // Sync events with console API.
  useAsync(async () => {
    if (
      currentUser &&
      urlState?.sourceId === "foxglove-data-platform" &&
      urlState.parameters != undefined
    ) {
      const queryParams = urlState.parameters as { deviceId: string; start: string; end: string };
      setEvents({ loading: true });
      try {
        const fetchedEvents = await consoleApi.getEvents(queryParams);
        setEvents({ loading: false, value: fetchedEvents });
      } catch (error) {
        log.error(error);
        setEvents({ loading: false, error });
      }
    } else {
      setEvents({ loading: false });
    }
  }, [consoleApi, currentUser, setEvents, urlState?.parameters, urlState?.sourceId]);

  // Sync hovered value and hovered events.
  useEffect(() => {
    if (hoverValue && timelineEvents && timeRange != undefined && timeRange > 0) {
      const hoverPosition = scale(hoverValue.value, 0, timeRange, 0, 1);
      const hoveredEvents = timelineEvents.filter((event) => {
        return (
          hoverPosition >= event.startPosition * (1 - HOVER_TOLERANCE) &&
          hoverPosition <= event.endPosition * (1 + HOVER_TOLERANCE)
        );
      });
      setHoveredEvents(hoveredEvents.map((event) => event.event));
    } else {
      setHoveredEvents([]);
    }
  }, [hoverValue, setHoveredEvents, timeRange, timelineEvents]);

  return ReactNull;
}
