// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  Callout,
  DirectionalHint,
  Icon,
  IconButton,
  Label,
  mergeStyleSets,
  Theme,
  useTheme,
} from "@fluentui/react";
import cx from "classnames";
import { useCombobox } from "downshift";
import React, { useState, useMemo, useRef } from "react";

declare global {
  interface Event {
    preventDownshiftDefault?: boolean;
  }
}

export type AutocompleteItem<T> = {
  key: React.Key;
  value: T;
  text: string;
  disabled?: boolean;
  type?: "divider";
};

type AutocompleteProps<T> = {
  getFilteredItems: (inputValue: string) => AutocompleteItem<T>[];
  selectedItem: AutocompleteItem<T>;
  onSelectedItemChange: (item: AutocompleteItem<T>) => void;
};

type ItemProps<T> = {
  item: AutocompleteItem<T>;
  selected: boolean;
  highlighted: boolean;
  last: boolean;
  itemProps: ReturnType<ReturnType<typeof useCombobox>["getItemProps"]>;
  styles: ReturnType<typeof getStyles>;
};

function Item<T>({
  item,
  selected,
  highlighted,
  last,
  itemProps,
  styles,
}: ItemProps<T>): React.ReactElement | ReactNull {
  if (item.type === "divider") {
    return last ? ReactNull : <li key={item.key} className={styles.divider} {...itemProps} />;
  }
  return (
    <li
      key={item.key}
      className={cx(styles.item, { [styles.highlightedItem]: highlighted })}
      {...itemProps}
    >
      <Icon iconName={selected ? "Checkmark" : ""} className={styles.checkIcon} />
      {item.text}
    </li>
  );
}

export default function FluentAutocomplete<T>(props: AutocompleteProps<T>): React.ReactElement {
  //FIXME: inputValue doesn't update when selectedItem changes externally
  // scroll into view not working
  const [inputValue, setInputValue] = useState(props.selectedItem.text);
  const [isOpen, setIsOpen] = useState(false);

  const { getFilteredItems } = props;
  const filteredItems = useMemo(() => getFilteredItems(inputValue), [getFilteredItems, inputValue]);
  const inputRef = useRef<HTMLInputElement>(ReactNull);

  console.log("selected item", props.selectedItem, "input value", inputValue);
  const {
    getToggleButtonProps,
    getLabelProps,
    getMenuProps,
    getInputProps,
    getComboboxProps,
    highlightedIndex,
    getItemProps,
  } = useCombobox({
    items: filteredItems,
    itemToString: (item) => {
      const r = item?.text ?? props.selectedItem.text;
      console.log("item to string:", r, item, "selected:", props.selectedItem);
      return r;
    },

    isOpen,
    onIsOpenChange: ({ isOpen: newValue }) => {
      if (newValue === true) {
        setInputValue("");
        setIsOpen(true);
      } else {
        setInputValue(props.selectedItem.text);
        setIsOpen(false);
      }
    },

    selectedItem: props.selectedItem,
    onSelectedItemChange: (changes) => {
      if (!changes.selectedItem) {
        return;
      }
      if (changes.type !== useCombobox.stateChangeTypes.ControlledPropUpdatedSelectedItem) {
        props.onSelectedItemChange(changes.selectedItem);
        inputRef.current?.blur();
      } else {
        console.log("ignore onSelectedItemChange", changes);
      }
    },

    inputValue,
    onInputValueChange: ({ type, inputValue: newValue, selectedItem: newSelectedItem }) => {
      if (type !== useCombobox.stateChangeTypes.ControlledPropUpdatedSelectedItem) {
        console.log("input value change", type, "to", newSelectedItem, "new value", newValue);
        setInputValue(newValue ?? "");
      }
    },
    stateReducer: (state, { changes }) => {
      // console.log("reducer", type);
      if (!state.isOpen && changes.isOpen === true) {
        // Prevent initial highlight when opening the menu, because the default highlighted index is
        // wrong: it's the index of the selected item, but we are about to change the list of items
        // via setInputValue("") as the menu opens. Having the wrong item highlighted is not a big
        // deal except that if you immediately click out of the menu, we get an onSelectedItemChange
        // with that item. Ideally we could correctly highlight the selected index when the menu
        // opens, but this is an easy quick fix.
        return { ...changes, highlightedIndex: -1 };
      }
      return changes;
    },
  });
  console.log("highlightedIndex", highlightedIndex);

  const comboboxRef = useRef<HTMLDivElement>(ReactNull);

  const theme = useTheme();

  const [focused, setFocused] = useState(false);

  const styles = useMemo(() => getStyles({ theme, focused }), [theme, focused]);
  return (
    <>
      <Label {...getLabelProps()}>Display timestamps in:</Label>
      <div {...getComboboxProps({ ref: comboboxRef, className: styles.container })}>
        <input
          {...getInputProps({
            className: styles.input,
            placeholder: props.selectedItem.text,
            ref: inputRef,
            onFocus: () => {
              setFocused(true);
              setInputValue("");
              setIsOpen(true);
            },
            onBlur: () => {
              setFocused(false);
              setInputValue(props.selectedItem.text);
            },
            onKeyDown: (event) => {
              if (event.key === "Escape") {
                if (isOpen) {
                  event.stopPropagation();
                } else {
                  event.nativeEvent.preventDownshiftDefault = true;
                }
              }
            },
          })}
        />
        <IconButton
          styles={{ root: styles.menuButton }}
          iconProps={{ iconName: "ChevronDown", styles: { root: styles.menuIcon } }}
          {...getToggleButtonProps()}
        />
      </div>
      <Callout
        isBeakVisible={false}
        hidden={!isOpen}
        target={comboboxRef.current}
        directionalHint={DirectionalHint.bottomLeftEdge}
        directionalHintFixed
      >
        <ul
          {...getMenuProps(
            {},
            // useComboBox complains about this ref not being applied correctly, probably because
            // the Callout manages when/where this component is mounted. But we are applying it to
            // the correct element.
            { suppressRefError: true },
          )}
        >
          {isOpen &&
            filteredItems.map((item, index) => (
              <Item
                key={item.key}
                last={index === filteredItems.length - 1}
                item={item}
                selected={item === props.selectedItem}
                highlighted={index === highlightedIndex}
                itemProps={getItemProps({
                  item,
                  index,
                  disabled: item.disabled === true || item.type === "divider",
                })}
                styles={styles}
              />
            ))}
        </ul>
      </Callout>
    </>
  );
}

function getStyles({ theme, focused }: { theme: Theme; focused: boolean }) {
  return mergeStyleSets({
    container: {
      maxWidth: 300,
      position: "relative",
      display: "flex",
      flexDirection: "row",
      paddingLeft: theme.spacing.s1,
      selectors: {
        // Create a border using a pseudo-element (a pattern in some Fluent components)
        ":after": [
          {
            pointerEvents: "none",
            content: "''",
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            right: 0,
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: theme.semanticColors.inputBorder,
            borderRadius: theme.effects.roundedCorner2,
          },
          focused && {
            borderColor: theme.semanticColors.inputFocusBorderAlt,
            borderWidth: 2,
          },
        ],
      },
      ":hover::after": !focused && {
        borderColor: theme.semanticColors.inputBorderHovered,
      },
    },
    input: {
      flexGrow: 1,
      padding: 0,
      backgroundColor: theme.semanticColors.inputBackground,
      color: theme.semanticColors.inputText,
      fontSize: theme.fonts.medium.fontSize,
    },
    item: {
      padding: theme.spacing.s1,
      cursor: "pointer",
    },
    highlightedItem: {
      backgroundColor: theme.semanticColors.menuItemBackgroundHovered,
    },
    divider: {
      height: 1,
      backgroundColor: theme.semanticColors.menuDivider,
    },
    menuButton: {
      color: theme.semanticColors.bodySubtext,
    },
    menuIcon: {
      fontSize: theme.fonts.small.fontSize,
    },
    checkIcon: {
      marginRight: theme.spacing.s1,
    },
  });
}
