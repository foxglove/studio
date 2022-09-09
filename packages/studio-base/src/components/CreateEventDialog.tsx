// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  Button,
  ButtonGroup,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import produce from "immer";
import { countBy } from "lodash";
import { useCallback, useState } from "react";
import { makeStyles } from "tss-react/mui";

import { toDate } from "@foxglove/rostime";
import {
  MessagePipelineContext,
  useMessagePipeline,
} from "@foxglove/studio-base/components/MessagePipeline";
import Stack from "@foxglove/studio-base/components/Stack";

const useStyles = makeStyles()((theme) => ({
  fields: {
    alignItems: "center",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: theme.spacing(1),
  },
}));

type KeyValue = { key: string; value: string };

const selectCurrentTime = (ctx: MessagePipelineContext) => ctx.playerState.activeData?.currentTime;

function formatDateTimeString(date: Date) {
  return date.toISOString().replace("Z", "");
}

export function CreateEventDialog(props: { deviceId: string; onClose: () => void }): JSX.Element {
  const { deviceId, onClose } = props;

  const { classes } = useStyles();

  const currentTime = useMessagePipeline(selectCurrentTime);
  const [event, setEvent] = useState<{
    startTime: undefined | Date;
    duration: undefined | number;
    durationUnit: "sec" | "nsec";
    metadata: KeyValue[];
  }>({
    startTime: currentTime ? toDate(currentTime) : undefined,
    duration: 5,
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

  const keyedMetadata = countBy(event.metadata, (kv) => kv.key);
  const hasDuplicateKey = Object.entries(keyedMetadata).some(
    ([key, count]) => key.length > 0 && count > 1,
  );

  const canSubmit = event.startTime != undefined && event.duration != undefined && !hasDuplicateKey;

  return (
    <Dialog open>
      <DialogTitle>Create Event</DialogTitle>
      <DialogContent>
        <div className={classes.fields}>
          <TextField value={deviceId} label="Device ID" style={{ gridColumn: "span 2" }} />
          <TextField
            label="Start time"
            value={event.startTime ? formatDateTimeString(event.startTime) : ""}
            type="datetime-local"
            onChange={(ev) => {
              const startTime = new Date(ev.currentTarget.value);
              setEvent((oldEvent) => ({ ...oldEvent, startTime }));
            }}
            inputProps={{ step: 1 }}
          />
          <Stack>
            <TextField
              value={event.duration ?? ""}
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
                  <ButtonGroup variant="contained" disableElevation size="small">
                    <Button
                      variant={event.durationUnit === "sec" ? "contained" : "outlined"}
                      onClick={() => setEvent((old) => ({ ...old, durationUnit: "sec" }))}
                    >
                      sec
                    </Button>
                    <Button
                      variant={event.durationUnit === "nsec" ? "contained" : "outlined"}
                      onClick={() => setEvent((old) => ({ ...old, durationUnit: "nsec" }))}
                    >
                      nsec
                    </Button>
                  </ButtonGroup>
                ),
              }}
            />
          </Stack>
          {event.metadata.map(({ key, value }, index) => {
            const hasDuplicate = ((key.length > 0 && keyedMetadata[key]) ?? 0) > 1;
            return (
              <>
                <TextField
                  key={`${index}_key`}
                  value={key}
                  autoFocus={index === 0}
                  placeholder="key"
                  error={hasDuplicate}
                  helperText={hasDuplicate ? "Duplicate key" : undefined}
                  label={index === 0 ? "Metadata" : undefined}
                  onChange={(ev) => updateMetadata(index, "key", ev.currentTarget.value)}
                />
                <TextField
                  key={`${index}_value`}
                  value={value}
                  placeholder="value"
                  label={index === 0 ? "value" : undefined}
                  helperText={hasDuplicate ? "error" : undefined}
                  FormHelperTextProps={{
                    style: {
                      visibility: "hidden",
                    },
                  }}
                  InputLabelProps={{
                    style: {
                      visibility: "hidden",
                    },
                  }}
                  onChange={(ev) => updateMetadata(index, "value", ev.currentTarget.value)}
                />
              </>
            );
          })}
        </div>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" size="large" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" size="large" onClick={onClose} disabled={!canSubmit}>
          Create Event
        </Button>
      </DialogActions>
    </Dialog>
  );
}
