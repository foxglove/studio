// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
//
// This file incorporates work covered by the following copyright and
// permission notice:
//
//   Copyright 2018-2021 Cruise LLC
//
//   This source code is licensed under the Apache License, Version 2.0,
//   found at http://www.apache.org/licenses/LICENSE-2.0
//   You may not use this file except in compliance with the License.

import ClearIcon from "@mui/icons-material/Clear";
import {
  alpha,
  Autocomplete as MuiAutocomplete,
  List,
  ListProps,
  MenuItem,
  TextField,
  useTheme,
} from "@mui/material";
import { Fzf, FzfResultItem } from "fzf";
import React, {
  CSSProperties,
  SyntheticEvent,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { makeStyles } from "tss-react/mui";

const ROW_HEIGHT = 24;
const MAX_ITEMS = 200;

const useStyles = makeStyles()((theme) => {
  const prefersDarkMode = theme.palette.mode === "dark";
  const inputBackgroundColor = prefersDarkMode
    ? "rgba(255, 255, 255, 0.09)"
    : "rgba(0, 0, 0, 0.06)";

  return {
    root: {
      ".MuiInputBase-root.MuiInputBase-sizeSmall": {
        backgroundColor: "transparent",
        paddingInline: 0,
        "&:focus-within": {
          backgroundColor: inputBackgroundColor,
        },
      },
    },
    inputError: {
      input: {
        color: theme.palette.error.main,
      },
    },
    item: {
      padding: 6,
      cursor: "pointer",
      minHeight: ROW_HEIGHT,
      lineHeight: `${ROW_HEIGHT - 10}px`,
      overflowWrap: "break-word",
      color: theme.palette.text.primary,
      whiteSpace: "pre",
    },
    itemSelected: {
      backgroundColor: alpha(
        theme.palette.primary.main,
        theme.palette.action.selectedOpacity + theme.palette.action.hoverOpacity,
      ),
    },
    itemHighlighted: {
      backgroundColor: theme.palette.action.hover,
    },
  };
});

// <Autocomplete> is a Studio-specific wrapper of MUI autocomplete with support
// for things like multiple autocompletes that seamlessly transition into each
// other, e.g. when building more complex strings like in the Plot panel.
type AutocompleteProps<T> = {
  autoSize?: boolean;
  disableAutoSelect?: boolean;
  disabled?: boolean;
  filterText?: string;
  getItemText?: (item: T) => string;
  getItemValue?: (item: T) => string;
  hasError?: boolean;
  inputStyle?: CSSProperties;
  items: readonly T[];
  menuStyle?: CSSProperties;
  minWidth?: number;
  onBlur?: () => void;
  onChange?: (event: React.SyntheticEvent<Element>, text: string) => void;
  onSelect: (value: string | T, autocomplete: IAutocomplete) => void;
  placeholder?: string;
  readOnly?: boolean;
  selectedItem?: T;
  selectOnFocus?: boolean;
  sortWhenFiltering?: boolean;
  value?: string;
};

export interface IAutocomplete {
  setSelectionRange(selectionStart: number, selectionEnd: number): void;
  focus(): void;
  blur(): void;
}

function defaultGetText(name: string): (item: unknown) => string {
  return function (item: unknown) {
    if (typeof item === "string") {
      return item;
    } else if (
      item != undefined &&
      typeof item === "object" &&
      typeof (item as { value?: string }).value === "string"
    ) {
      return (item as { value: string }).value;
    }
    throw new Error(`you need to provide an implementation of ${name}`);
  };
}

const EMPTY_SET = new Set<number>();

function itemToFzfResult<T>(item: T): FzfResultItem<T> {
  return {
    item,
    score: 0,
    positions: EMPTY_SET,
    start: 0,
    end: 0,
  };
}

const HighlightChars = (props: { str: string; indices: Set<number> }) => {
  const theme = useTheme();
  const chars = props.str.split("");

  const nodes = chars.map((char, i) => {
    if (props.indices.has(i)) {
      return (
        <b key={i} style={{ color: theme.palette.info.main }}>
          {char}
        </b>
      );
    } else {
      return char;
    }
  });

  return <>{nodes}</>;
};

export default React.forwardRef(function Autocomplete<T = unknown>(
  props: AutocompleteProps<T>,
  ref: React.ForwardedRef<IAutocomplete>,
): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(ReactNull);

  const { classes, cx } = useStyles();

  const [stateValue, setValue] = useState<string | undefined>(undefined);

  const getItemText = useMemo(
    () => props.getItemText ?? defaultGetText("getItemText"),
    [props.getItemText],
  );

  const getItemValue = useMemo(
    () => props.getItemValue ?? defaultGetText("getItemValue"),
    [props.getItemValue],
  );

  // Props
  const {
    selectedItem,
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    value = stateValue ?? (selectedItem ? getItemText(selectedItem) : undefined),
    disabled,
    filterText = value ?? "",
    items,
    onBlur: onBlurCallback,
    onChange: onChangeCallback,
    onSelect: onSelectCallback,
    placeholder,
    readOnly,
    selectOnFocus,
    sortWhenFiltering = true,
  }: AutocompleteProps<T> = props;

  const fzfUnfiltered = useMemo(() => {
    return items.map((item) => itemToFzfResult(item));
  }, [items]);

  const fzf = useMemo(() => {
    // @ts-expect-error Fzf selector TS type seems to be wrong?
    return new Fzf(items, {
      fuzzy: "v2",
      sort: sortWhenFiltering,
      limit: MAX_ITEMS,
      selector: getItemText,
    });
  }, [getItemText, items, sortWhenFiltering]);

  const autocompleteItems: FzfResultItem<T>[] = useMemo(() => {
    return filterText ? fzf.find(filterText) : fzfUnfiltered;
  }, [filterText, fzf, fzfUnfiltered]);

  const hasError = Boolean(props.hasError ?? (autocompleteItems.length === 0 && value?.length));

  const selectedItemValue = selectedItem != undefined ? getItemValue(selectedItem) : undefined;
  const setSelectionRange = useCallback((selectionStart: number, selectionEnd: number): void => {
    inputRef.current?.focus();
    inputRef.current?.setSelectionRange(selectionStart, selectionEnd);
  }, []);

  const focus = useCallback((): void => {
    inputRef.current?.focus();
  }, []);

  const blur = useCallback((): void => {
    inputRef.current?.blur();
    if (onBlurCallback) {
      onBlurCallback();
    }
  }, [onBlurCallback]);

  // Give callers an opportunity to control autocomplete
  useImperativeHandle(ref, () => ({ setSelectionRange, focus, blur }), [
    setSelectionRange,
    focus,
    blur,
  ]);

  const onChange = useCallback(
    (_event: ReactNull | React.SyntheticEvent<Element>, newValue: string): void => {
      if (onChangeCallback) {
        if (_event) {
          onChangeCallback(_event, newValue);
        }
      } else {
        setValue(newValue);
      }
    },
    [onChangeCallback],
  );

  // To allow multiple completions in sequence, it's up to the parent component
  // to manually blur the input to finish a completion.
  const onSelect = useCallback(
    (
      _event: SyntheticEvent<Element>,
      selectedValue: ReactNull | string | FzfResultItem<T>,
    ): void => {
      if (selectedValue != undefined && typeof selectedValue !== "string") {
        setValue(undefined);
        onSelectCallback(selectedValue.item, { setSelectionRange, focus, blur });
      }
    },
    [onSelectCallback, blur, focus, setSelectionRange],
  );

  const filterOptions = useCallback(
    (options: FzfResultItem<T>[]) => {
      // Don't filter out options here because we assume that the parent
      // component has already filtered them. This allows completing fragments.
      //
      // If we have input then slice the options to improve performance since
      // the MUI autocomplete is slow with many items.
      if (value == undefined || value === "") {
        return options;
      } else {
        return options.slice(0, 25);
      }
    },
    [value],
  );

  return (
    <MuiAutocomplete
      className={classes.root}
      size="small"
      options={autocompleteItems}
      disableCloseOnSelect
      fullWidth
      openOnFocus
      disabled={disabled}
      selectOnFocus={selectOnFocus}
      readOnly={readOnly}
      componentsProps={{ clearIndicator: { size: "small" } }}
      clearIcon={<ClearIcon fontSize="small" />}
      ListboxComponent={List}
      ListboxProps={{ dense: true } as Partial<ListProps>}
      renderInput={(params) => (
        <TextField
          {...params}
          variant="filled"
          inputRef={inputRef}
          placeholder={placeholder}
          className={cx({ [classes.inputError]: hasError })}
          size="small"
        />
      )}
      getOptionLabel={(item: string | FzfResultItem<T>) => {
        if (typeof item === "string") {
          return item;
        }
        return getItemValue(item.item);
      }}
      renderOption={(optProps, item: FzfResultItem<T>, { selected }) => {
        const itemValue = getItemValue(item.item);
        return (
          <MenuItem
            dense
            {...optProps}
            key={itemValue}
            data-highlighted={selected}
            data-test-auto-item
            className={cx(classes.item, {
              [classes.itemHighlighted]: selected,
              [classes.itemSelected]:
                selectedItemValue != undefined && itemValue === selectedItemValue,
            })}
          >
            <HighlightChars str={getItemText(item.item)} indices={item.positions} />
          </MenuItem>
        );
      }}
      filterOptions={filterOptions}
      freeSolo
      onInputChange={onChange}
      onChange={onSelect}
      value={value ?? ReactNull}
    />
  );
}) as <T>(props: AutocompleteProps<T> & React.RefAttributes<IAutocomplete>) => JSX.Element; // https://stackoverflow.com/a/58473012/23649
