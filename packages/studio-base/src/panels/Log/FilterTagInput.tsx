// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  Autocomplete,
  MenuItem,
  MenuList,
  MenuListProps,
  TextField,
  autocompleteClasses,
  inputBaseClasses,
} from "@mui/material";
import { makeStyles } from "tss-react/mui";

const useStyles = makeStyles()((theme) => ({
  input: {
    gap: theme.spacing(0.25),
    flexWrap: "wrap",

    [`&.${inputBaseClasses.root}.${autocompleteClasses.input}`]: {
      width: "auto",
    },
    [`&.${inputBaseClasses.root}.${inputBaseClasses.sizeSmall}`]: {
      paddingBlock: theme.spacing(0.275),
      paddingLeft: theme.spacing(0.25),
    },
  },
  chip: {
    [`&.${autocompleteClasses.tag}`]: {
      margin: 0,
    },
  },
}));

export function FilterTagInput({
  items,
  suggestions,
  onChange,
}: {
  items: string[];
  suggestions: string[];
  onChange: (items: string[]) => void;
}): JSX.Element {
  const { classes } = useStyles();

  return (
    <Autocomplete
      value={items}
      multiple
      onChange={(_event, value) => onChange(value)}
      id="tags-filled"
      options={suggestions}
      freeSolo
      fullWidth
      ChipProps={{
        className: classes.chip,
        variant: "filled",
        size: "small",
      }}
      ListboxComponent={MenuList}
      ListboxProps={{ dense: true } as MenuListProps}
      renderOption={(props, option) => <MenuItem {...props}>{option}</MenuItem>}
      renderInput={(params) => (
        <TextField
          {...params}
          size="small"
          InputProps={{
            ...params.InputProps,
            className: classes.input,
          }}
          placeholder="Search filter"
        />
      )}
    />
  );
}
