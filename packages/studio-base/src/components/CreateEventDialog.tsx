// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  Grid,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  FormLabel,
} from "@mui/material";
import produce from "immer";
import { countBy } from "lodash";
import { Fragment, KeyboardEvent, useCallback, useState } from "react";
import { useAsyncFn } from "react-use";
import { keyframes } from "tss-react";
import { makeStyles } from "tss-react/mui";

import Log from "@foxglove/log";
import { toDate, toNanoSec } from "@foxglove/rostime";
import {
  MessagePipelineContext,
  useMessagePipeline,
} from "@foxglove/studio-base/components/MessagePipeline";
import Stack from "@foxglove/studio-base/components/Stack";
import { useConsoleApi } from "@foxglove/studio-base/context/ConsoleApiContext";
import { EventsStore, useEvents } from "@foxglove/studio-base/context/EventsContext";

const log = Log.getLogger(__filename);

const fadeInAnimation = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const useStyles = makeStyles<void, "toggleButton" | "field">()((theme, _params, classes) => ({
  grid: {
    alignItems: "center",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: theme.spacing(1),
    overflow: "auto",
    alignContent: "flex-start",
  },
  row: {
    animation: `${fadeInAnimation} 0.2s ease-in-out`,
    display: "contents",

    "&:hover": {
      [`.${classes.field} .MuiOutlinedInput-root`]: {
        backgroundColor: theme.palette.action.hover,
      },
    },
    "&:focus-within": {
      [`.${classes.field} .MuiOutlinedInput-root`]: {
        backgroundColor: theme.palette.action.focus,
      },
    },
  },
  field: {}, // keep for parent selector
  toggleButton: {
    border: "none",
    lineHeight: 1,
  },
  toggleButtonGroup: {
    marginRight: theme.spacing(-1),
    gap: theme.spacing(0.25),

    [`.${classes.toggleButton}`]: {
      borderRadius: `${theme.shape.borderRadius}px !important`,
      marginLeft: "0px !important",
      borderLeft: "none !important",
    },
  },
}));

type KeyValue = { key: string; value: string };

const selectCurrentTime = (ctx: MessagePipelineContext) => ctx.playerState.activeData?.currentTime;
const selectRefreshEvents = (store: EventsStore) => store.refreshEvents;

function formatDateTimeString(date: Date) {
  return date.toISOString().replace("Z", "");
}

export function CreateEventDialog(props: { deviceId: string; onClose: () => void }): JSX.Element {
  const { deviceId, onClose } = props;

  const { classes } = useStyles();
  const consoleApi = useConsoleApi();

  const refreshEvents = useEvents(selectRefreshEvents);
  const currentTime = useMessagePipeline(selectCurrentTime);
  const [event, setEvent] = useState<{
    startTime: undefined | Date;
    duration: undefined | number;
    durationUnit: "sec" | "nsec";
    metadata: KeyValue[];
  }>({
    startTime: currentTime ? toDate(currentTime) : undefined,
    duration: 0,
    durationUnit: "sec",
    metadata: [{ key: "", value: "" }],
  });

  const updateMetadata = useCallback((index: number, position: keyof KeyValue, value: string) => {
    setEvent(
      produce((draft) => {
        const keyval = draft.metadata[index];
        if (keyval) {
          keyval[position] = value;

          // Automatically add new row if we're at the end and have both key and value.
          if (
            index === draft.metadata.length - 1 &&
            keyval.key.length > 0 &&
            keyval.value.length > 0
          ) {
            draft.metadata.push({ key: "", value: "" });
          }
        }
      }),
    );
  }, []);

  const countedMetadata = countBy(event.metadata, (kv) => kv.key);
  const hasDuplicateKey = Object.entries(countedMetadata).some(
    ([key, count]) => key.length > 0 && count > 1,
  );
  const canSubmit = event.startTime != undefined && event.duration != undefined && !hasDuplicateKey;

  const [createdEvent, createEvent] = useAsyncFn(async () => {
    if (event.startTime == undefined || event.duration == undefined) {
      return;
    }

    const filteredMeta = event.metadata.filter(
      (meta) => meta.key.length > 0 && meta.value.length > 0,
    );
    const keyedMetadata = Object.fromEntries(
      filteredMeta.map((meta) => [meta.key.trim(), meta.value.trim()]),
    );
    await consoleApi.createEvent({
      deviceId,
      timestamp: event.startTime.toISOString(),
      durationNanos: toNanoSec(
        event.durationUnit === "sec"
          ? { sec: event.duration, nsec: 0 }
          : { sec: 0, nsec: event.duration },
      ).toString(),
      metadata: keyedMetadata,
    });
    onClose();
    refreshEvents();
  }, [consoleApi, deviceId, event, onClose, refreshEvents]);

  const onMetaDataKeyDown = useCallback(
    (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === "Enter") {
        createEvent().catch((error) => log.error(error));
      }
    },
    [createEvent],
  );

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <Stack paddingX={3} paddingTop={2}>
        <Typography variant="h2">Create event</Typography>
        <Typography variant="subtitle2" color="text.secondary">{`${toDate(
          currentTime,
        )}`}</Typography>
      </Stack>
      <Grid container spacing={1} paddingX={3} paddingTop={2}>
        <Grid item xs={12} md={6}>
          <TextField
            label="Start time"
            fullWidth
            value={event.startTime ? formatDateTimeString(event.startTime) : ""}
            type="datetime-local"
            onChange={(ev) => {
              const startTime = new Date(ev.currentTarget.value);
              setEvent((oldEvent) => ({ ...oldEvent, startTime }));
            }}
            inputProps={{ step: 1 }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            value={event.duration ?? ""}
            fullWidth
            label="Duration"
            onChange={(ev) => {
              const duration = Number(ev.currentTarget.value);
              setEvent((oldEvent) => ({
                ...oldEvent,
                duration: duration > 0 ? duration : undefined,
              }));
            }}
            type="number"
            InputProps={{
              endAdornment: (
                <ToggleButtonGroup
                  className={classes.toggleButtonGroup}
                  size="small"
                  exclusive
                  value={event.durationUnit}
                  onChange={(_ev, durationUnit) => {
                    if (event.durationUnit !== durationUnit) {
                      setEvent((old) => ({ ...old, durationUnit }));
                    }
                  }}
                >
                  <ToggleButton className={classes.toggleButton} tabIndex={-1} value="sec">
                    sec
                  </ToggleButton>
                  <ToggleButton className={classes.toggleButton} tabIndex={-1} value="nsec">
                    nsec
                  </ToggleButton>
                </ToggleButtonGroup>
              ),
            }}
          />
        </Grid>
      </Grid>
      <Stack paddingX={3} paddingTop={2}>
        <FormLabel>Metadata</FormLabel>

        <div className={classes.grid}>
          {event.metadata.map(({ key, value }, index) => {
            const hasDuplicate = ((key.length > 0 && countedMetadata[key]) ?? 0) > 1;
            return (
              <Fragment key={index}>
                <div className={classes.row}>
                  <TextField
                    className={classes.field}
                    fullWidth
                    value={key}
                    autoFocus={index === 0}
                    placeholder="key"
                    error={hasDuplicate}
                    helperText={hasDuplicate ? "Duplicate key" : undefined}
                    onKeyDown={onMetaDataKeyDown}
                    onChange={(ev) => updateMetadata(index, "key", ev.currentTarget.value)}
                  />
                  <TextField
                    className={classes.field}
                    fullWidth
                    value={value}
                    placeholder="value"
                    helperText={hasDuplicate ? "error" : undefined}
                    onKeyDown={onMetaDataKeyDown}
                    onChange={(ev) => updateMetadata(index, "value", ev.currentTarget.value)}
                  />
                </div>
              </Fragment>
            );
          })}
        </div>
      </Stack>
      <DialogActions>
        <Button variant="outlined" size="large" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          size="large"
          onClick={createEvent}
          disabled={!canSubmit || createdEvent.loading}
        >
          {createdEvent.loading && (
            <CircularProgress color="inherit" size="1rem" style={{ marginRight: "0.5rem" }} />
          )}
          Create Event
        </Button>
      </DialogActions>
      {createdEvent.error?.message && <Alert severity="error">{createdEvent.error.message}</Alert>}
    </Dialog>
  );
}
