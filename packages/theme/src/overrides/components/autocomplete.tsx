// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import CancelIcon from "@mui/icons-material/Cancel";
import { Theme, autocompleteClasses, inputBaseClasses, inputClasses } from "@mui/material";

import { OverrideComponentReturn } from "../../types";

export const MuiAutocomplete = (theme: Theme): OverrideComponentReturn<"MuiAutocomplete"> => ({
  defaultProps: {
    clearIcon: <CancelIcon fontSize="inherit" />,
    componentsProps: {
      clearIndicator: {
        size: "small",
      },
    },
  },
  styleOverrides: {
    root: {
      minWidth: 144,
    },
    inputRoot: {
      [`&.${inputBaseClasses.root}`]: {
        padding: theme.spacing(1, 1.25),

        [`.${autocompleteClasses.input}`]: {
          padding: 0,
        },
        [`&.${inputBaseClasses.sizeSmall}`]: {
          padding: theme.spacing(0.75, 1),
        },
      },
      [`.${autocompleteClasses.input}.${inputClasses.inputAdornedEnd}`]: {
        paddingRight: theme.spacing(0.75),
      },
    },
    clearIndicator: {
      marginRight: theme.spacing(-0.5),
      opacity: theme.palette.action.disabledOpacity,

      ":hover": {
        background: "transparent",
        opacity: 1,
      },
    },
    endAdornment: {
      display: "flex",
      alignItems: "center",
      top: `calc(50% - ${theme.spacing(1.5)})`,

      [`.${autocompleteClasses.root} .${inputBaseClasses.sizeSmall}.${inputBaseClasses.root} &`]: {
        right: theme.spacing(0.75),
      },
    },
  },
});
