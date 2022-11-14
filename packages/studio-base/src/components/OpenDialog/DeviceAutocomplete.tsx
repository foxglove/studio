// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Autocomplete, Box, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { useAsync } from "react-use";

import { useConsoleApi } from "@foxglove/studio-base/context/ConsoleApiContext";

export function DeviceAutocomplete(): JSX.Element {
  const api = useConsoleApi();

  const { value: devices, loading } = useAsync(async () => {
    return await api.getDevices();
  }, [api]);

  const [selectedDevice, setSelectedDevice] = useState(undefined);

  return (
    <Autocomplete
      options={devices ?? []}
      loading={loading}
      getOptionLabel={(option) => option.name}
      value={selectedDevice}
      renderOption={(optionProps, option) => (
        <li {...optionProps}>
          <Box py={0.25}>
            <Typography variant="subtitle1" marginRight={1}>
              {option.name}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              {option.id}
            </Typography>
          </Box>
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Device"
          placeholder="Filter by device"
          inputProps={{
            ...params.inputProps,
            autoComplete: "off",
          }}
          InputProps={{
            ...params.InputProps,
            notched: false,
          }}
          InputLabelProps={{
            shrink: true,
            variant: "standard",
            sx: { position: "relative" },
          }}
        />
      )}
      onChange={(_, device) => {
        // fixme
      }}
    />
  );
}
