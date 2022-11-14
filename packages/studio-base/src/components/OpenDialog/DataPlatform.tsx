// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Tabs, Tab, Divider, TextField, Link, Button } from "@mui/material";
import { useCallback, useState } from "react";
import { useAsync } from "react-use";

import { toRFC3339String } from "@foxglove/rostime";
import { DeviceAutocomplete } from "@foxglove/studio-base/components/OpenDialog/DeviceAutocomplete";
import { useConsoleApi } from "@foxglove/studio-base/context/ConsoleApiContext";
import { usePlayerSelection } from "@foxglove/studio-base/context/PlayerSelectionContext";
import { ConsoleEvent } from "@foxglove/studio-base/services/ConsoleApi";

function EventsView() {
  const api = useConsoleApi();
  const { selectSource } = usePlayerSelection();

  const [query, setQuery] = useState<string>("");

  const { value: events } = useAsync(async () => {
    return await api.getEvents({
      query,
    });
  }, [api, query]);

  const openEventAction = useCallback(
    (event: ConsoleEvent) => {
      // fixme - ?? hard coded data platform source?
      selectSource("foxglove-data-platform", {
        type: "connection",
        params: {
          deviceId: event.deviceId,
          start: toRFC3339String(event.startTime),
          end: toRFC3339String(event.endTime),
        },
      });
    },
    [selectSource],
  );

  return (
    <>
      <Button>Open in Console</Button>
      <DeviceAutocomplete />
      <TextField
        label="Query"
        onChange={(ev) => {
          setQuery(ev.target.value);
        }}
      />
      <Divider />
      {events?.map((event) => {
        return (
          <div key={event.id}>
            <span>{event.id}</span>
            <span>
              {event.startTime.sec}.{event.startTime.nsec}
            </span>
            <span>{event.durationNanos}</span>
            <span>
              <Link onClick={() => openEventAction(event)}>open</Link>
            </span>
          </div>
        );
      })}
    </>
  );
}

function TimelineView() {
  return <></>;
}

export function DataPlatform(): JSX.Element {
  const [tabValue, setTabValue] = useState("timeline");

  return (
    <div>
      <div>
        <Tabs value={tabValue} onChange={(_ev, newValue: string) => setTabValue(newValue)}>
          <Tab label="Timeline" value="timeline" />
          <Tab label="Events" value="events" />
        </Tabs>
      </div>
      {tabValue === "timeline" && (
        <div>
          <TimelineView />
        </div>
      )}
      {tabValue === "events" && (
        <div>
          <EventsView />
        </div>
      )}
    </div>
  );
}
