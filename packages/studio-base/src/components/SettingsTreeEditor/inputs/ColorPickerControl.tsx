// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { TextField, InputAdornment } from "@mui/material";
import { useCallback, useState, useEffect, useMemo } from "react";
import { HexAlphaColorPicker, HexColorPicker } from "react-colorful";
import tinycolor from "tinycolor2";
import { makeStyles } from "tss-react/mui";
import { useDebouncedCallback } from "use-debounce";

import Stack from "@foxglove/studio-base/components/Stack";

const useStyles = makeStyles()((theme) => ({
  container: {
    padding: theme.spacing(2),
  },
  picker: {
    ".react-colorful__last-control": {
      borderRadius: 0,
    },
    ".react-colorful__saturation": {
      borderRadius: 0,
    },
  },
}));

type ColorPickerInputProps = {
  alphaType: "none" | "alpha";
  value: undefined | string;
  onChange: (value: string) => void;
};

function isValidHexColor(color: string, alphaType: "none" | "alpha") {
  return alphaType === "alpha" ? /^[0-9a-f]{8}$/i.test(color) : /^[0-9a-f]{6}$/i.test(color);
}

export function ColorPickerControl(props: ColorPickerInputProps): JSX.Element {
  const { alphaType, onChange, value } = props;

  const { classes } = useStyles();

  const parsedValue = useMemo(() => (value ? tinycolor(value) : undefined), [value]);
  const displayValue =
    alphaType === "alpha" ? parsedValue?.toHex8String() : parsedValue?.toHexString();
  const swatchColor = displayValue ?? "#00000044";

  const [editedValue, setEditedValue] = useState("");

  const editedValueIsInvalid = editedValue.length > 0 && !isValidHexColor(editedValue, alphaType);

  const updateColor = useDebouncedCallback((newValue: string) => {
    onChange(newValue);
  });

  const updateEditedValue = useCallback(
    (newValue: string) => {
      setEditedValue(newValue);

      if (isValidHexColor(newValue, alphaType)) {
        onChange(newValue);
      }
    },
    [alphaType, onChange],
  );

  useEffect(() => {
    setEditedValue((alphaType === "alpha" ? parsedValue?.toHex8() : parsedValue?.toHex()) ?? "");
  }, [alphaType, parsedValue]);

  return (
    <Stack className={classes.container} gap={1}>
      {alphaType === "alpha" ? (
        <HexAlphaColorPicker
          className={classes.picker}
          color={swatchColor}
          onChange={(newValue) => updateColor(newValue)}
        />
      ) : (
        <HexColorPicker
          className={classes.picker}
          color={swatchColor}
          onChange={(newValue) => updateColor(newValue)}
        />
      )}
      <TextField
        label="Hex"
        error={editedValueIsInvalid}
        InputProps={{
          startAdornment: <InputAdornment position="start">#</InputAdornment>,
        }}
        value={editedValue}
        onChange={(event) => updateEditedValue(event.target.value)}
      />
    </Stack>
  );
}
