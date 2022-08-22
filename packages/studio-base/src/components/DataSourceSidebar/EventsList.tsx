// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import SearchIcon from "@mui/icons-material/Search";
import { alpha, AppBar, CircularProgress, TextField, Typography } from "@mui/material";
import { compact } from "lodash";
import { Fragment, useCallback, useMemo, useState } from "react";
import { makeStyles } from "tss-react/mui";

import { fromNanoSec, subtract, toSec } from "@foxglove/rostime";
import {
  MessagePipelineContext,
  useMessagePipeline,
} from "@foxglove/studio-base/components/MessagePipeline";
import Stack from "@foxglove/studio-base/components/Stack";
import { useEvents } from "@foxglove/studio-base/context/EventsContext";
import {
  useClearHoverValue,
  useSetHoverValue,
} from "@foxglove/studio-base/context/HoverValueContext";
import { useAppTimeFormat } from "@foxglove/studio-base/hooks";
import { ConsoleEvent } from "@foxglove/studio-base/services/ConsoleApi";

const useStyles = makeStyles<void, "eventMetadata">()((theme, _params, classes) => ({
  appBar: {
    top: -1,
    zIndex: theme.zIndex.appBar - 1,
    display: "flex",
    flexDirection: "row",
    padding: theme.spacing(1),
    gap: theme.spacing(1),
    alignItems: "center",
  },
  grid: {
    backgroundColor: theme.palette.divider,
    display: "grid",
    flex: 1,
    gap: "1px",
    gridTemplateColumns: "auto 1fr",
    overflowY: "auto",
    paddingTop: "1px",
  },
  root: {
    backgroundColor: theme.palette.background.paper,
    maxHeight: "100%",
  },
  spacer: {
    backgroundColor: theme.palette.background.paper,
    height: theme.spacing(1),
    gridColumn: "span 2",
  },
  event: {
    display: "contents",
    cursor: "default",

    "&:hover": {
      [`.${classes.eventMetadata}`]: {
        backgroundColor: alpha(theme.palette.primary.main, theme.palette.action.activatedOpacity),
      },
    },
  },
  eventMetadata: {
    padding: theme.spacing(1),
    backgroundColor: theme.palette.background.default,
  },
  targetedEvent: {
    fontWeight: "bold",
  },
}));

const selectStartTime = (ctx: MessagePipelineContext) => ctx.playerState.activeData?.startTime;
const selectTargetEventId = ({ playerState }: MessagePipelineContext) =>
  playerState.urlState?.parameters?.eventId;

function EventView(params: {
  event: ConsoleEvent;
  formattedTime: string;
  isTargeted: boolean;
  onHoverStart: (event: ConsoleEvent) => void;
  onHoverEnd: (event: ConsoleEvent) => void;
}): JSX.Element {
  const { event, formattedTime, isTargeted, onHoverStart, onHoverEnd } = params;
  const { classes, cx } = useStyles();

  const fields = compact([
    ["timestamp", formattedTime],
    Number(event.durationNanos) > 0 && ["duration", `${event.durationNanos}ns`],
    ...Object.entries(event.metadata),
  ]);

  return (
    <div
      className={classes.event}
      onMouseEnter={() => onHoverStart(event)}
      onMouseLeave={() => onHoverEnd(event)}
    >
      {fields.map(([key, value]) => (
        <Fragment key={key}>
          <div className={cx(classes.eventMetadata, { [classes.targetedEvent]: isTargeted })}>
            {key}
          </div>
          <div className={cx(classes.eventMetadata, { [classes.targetedEvent]: isTargeted })}>
            {value}
          </div>
        </Fragment>
      ))}
      <div className={classes.spacer} />
    </div>
  );
}

const MemoEventView = React.memo(EventView);

export function EventsList(): JSX.Element {
  const events = useEvents((store) => store.events);
  const { formatTime } = useAppTimeFormat();
  const startTime = useMessagePipeline(selectStartTime);
  const setHoverValue = useSetHoverValue();
  const clearHoverValue = useClearHoverValue();
  const [filter, setFilter] = useState("");
  const targetEventId = useMessagePipeline(selectTargetEventId);

  const filteredEvents = useMemo(() => {
    if (filter.length === 0) {
      return events.value ?? [];
    }
    const lowFilter = filter.toLowerCase();

    return (events.value ?? []).filter((event) =>
      Object.values(event.metadata).some((value) => value.toLowerCase().includes(lowFilter)),
    );
  }, [events.value, filter]);

  const timestampedEvents = useMemo(
    () =>
      filteredEvents.map((event) => {
        const time = fromNanoSec(BigInt(event.timestampNanos));

        return { event, formattedTime: formatTime(time) };
      }),
    [filteredEvents, formatTime],
  );

  const onHoverEnd = useCallback(
    (event: ConsoleEvent) => {
      clearHoverValue(`event_${event.id}`);
    },
    [clearHoverValue],
  );

  const onHoverStart = useCallback(
    (event: ConsoleEvent) => {
      const time = fromNanoSec(BigInt(event.timestampNanos));
      const delta = startTime ? subtract(time, startTime) : undefined;
      const deltaTime = delta ? toSec(delta) : undefined;
      const hoverId = `event_${event.id}`;

      if (deltaTime == undefined) {
        return;
      }

      setHoverValue({
        componentId: hoverId,
        type: "PLAYBACK_SECONDS",
        value: deltaTime,
      });
    },
    [setHoverValue, startTime],
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
          }}
        />
      </AppBar>
      <div className={classes.grid}>
        {timestampedEvents.map((event) => {
          return (
            <MemoEventView
              key={event.event.id}
              event={event.event}
              formattedTime={event.formattedTime}
              isTargeted={event.event.id === targetEventId}
              onHoverStart={onHoverStart}
              onHoverEnd={onHoverEnd}
            />
          );
        })}
      </div>
    </Stack>
  );
}
