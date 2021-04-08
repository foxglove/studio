// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
import {
  Callout,
  Checkbox,
  ChoiceGroup,
  ChoiceGroupOption,
  ComboBox,
  CommandButton,
  ContextualMenu,
  DirectionalHint,
  getInputFocusStyle,
  IChoiceGroupOption,
  IComboBoxOption,
  Icon,
  IconButton,
  Label,
  mergeStyleSets,
  Pivot,
  PivotItem,
  SelectableOptionMenuItemType,
  Stack,
  Text,
  TextField,
  useTheme,
} from "@fluentui/react";
import { useId } from "@fluentui/react-hooks";
import cx from "classnames";
import { useCombobox } from "downshift";
import moment from "moment-timezone";
import { useCallback, useMemo, useRef, useState } from "react";

import OsContextSingleton from "@foxglove-studio/app/OsContextSingleton";
import { ExperimentalFeatureSettings } from "@foxglove-studio/app/components/ExperimentalFeatureSettings";
import { useAsyncAppConfigurationValue } from "@foxglove-studio/app/hooks/useAsyncAppConfigurationValue";
import filterMap from "@foxglove-studio/app/util/filterMap";
import fuzzyFilter from "@foxglove-studio/app/util/fuzzyFilter";

function formatTimezone(name: string) {
  const tz = moment.tz(name);
  const zoneAbbr = tz.zoneAbbr();
  const offset = tz.utcOffset();
  const offsetStr =
    (offset >= 0 ? "+" : "") + moment.duration(offset, "minutes").format("hh:mm", { trim: false });
  if (name === zoneAbbr) {
    return `${zoneAbbr} (${offsetStr})`;
  }
  return `${name} (${zoneAbbr}, ${offsetStr})`;
}

type MenuItem = { key: string; text: string; value: string; disabled?: boolean };

function TimezoneSettings(): React.ReactElement {
  const [timezone, setTimezone] = useAsyncAppConfigurationValue<string>("timezone", {
    optimistic: true,
  });
  const detectItem = useMemo(
    () => ({
      key: "detect",
      text: `Detect from system: ${formatTimezone(moment.tz.guess())}`,
      value: "",
    }),
    [],
  );
  const fixedItems: MenuItem[] = useMemo(
    () => [
      detectItem,
      { key: "zone:UTC", text: `${formatTimezone("UTC")}`, value: "UTC" },
      { key: "sep", text: "-", value: "-separator-", disabled: true },
    ],
    [detectItem],
  );
  const timezoneItems: MenuItem[] = useMemo(
    () =>
      filterMap(moment.tz.names(), (name) => {
        // UTC is always hoisted to the top in fixedItems
        if (name === "UTC") {
          return undefined;
        }
        return { key: `zone:${name}`, text: formatTimezone(name), value: name };
      }),
    [],
  );

  const itemsByValue = useMemo(() => {
    const map = new Map<string, MenuItem>();
    for (const item of fixedItems) {
      map.set(item.value, item);
    }
    for (const item of timezoneItems) {
      map.set(item.value, item);
    }
    return map;
  }, [fixedItems, timezoneItems]);

  const selectedItem = useMemo(() => itemsByValue.get(timezone.value ?? "") ?? detectItem, [
    itemsByValue,
    timezone.value,
    detectItem,
  ]);

  const onTimezoneSettingChange = useCallback((event, option?: IChoiceGroupOption) => {}, []);

  const [inputValue, setInputValue] = useState(selectedItem.text);
  const [isOpen, setIsOpen] = useState(false);
  const filteredItems = useMemo(
    () => fuzzyFilter(timezoneItems, inputValue, (option) => option.text),
    [timezoneItems, inputValue],
  );

  console.log("selected item", selectedItem, "input value", inputValue);
  const allItems = useMemo(() => [...fixedItems, ...filteredItems], [fixedItems, filteredItems]);
  const {
    getToggleButtonProps,
    getLabelProps,
    getMenuProps,
    getInputProps,
    getComboboxProps,
    highlightedIndex,
    getItemProps,
  } = useCombobox({
    items: allItems,
    itemToString: (item) => item?.text ?? "",

    isOpen,
    onIsOpenChange: ({ isOpen: newValue }) => setIsOpen(newValue ?? false),

    selectedItem,
    onSelectedItemChange: (changes) => {
      if (!changes.selectedItem) {
        return;
      }
      if (changes.type !== useCombobox.stateChangeTypes.ControlledPropUpdatedSelectedItem) {
        setTimezone(changes.selectedItem.value);
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
    // stateReducer: (state, { type, changes }) => {
    //   // console.log("reducer", type);
    //   if (!state.isOpen && changes.isOpen === true) {
    //     return { ...changes, inputValue: "" };
    //   }
    //   return changes;
    // },
  });

  const comboboxRef = useRef<HTMLDivElement>(ReactNull);

  const theme = useTheme();

  const [focused, setFocused] = useState(false);

  const styles = mergeStyleSets({
    container: {
      maxWidth: 300,
      position: "relative",
      display: "flex",
      flexDirection: "row",
      paddingLeft: theme.spacing.s1,
      selectors: {
        // setting border using pseudo-element here in order to
        // prevent chevron button to overlap ComboBox border under certain resolutions
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
      // width: "100%",
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
  });

  return (
    <>
      <Label {...getLabelProps()}>Display timestamps in:</Label>
      <div {...getComboboxProps({ ref: comboboxRef, className: styles.container })}>
        <input
          {...getInputProps({
            className: styles.input,
            onFocus: () => {
              setFocused(true);
              setIsOpen(true);
            },
            onBlur: () => setFocused(false),
            onKeyDown: (event) => {
              if (event.key === "Escape") {
                if (isOpen) {
                  event.stopPropagation();
                } else {
                  (event.nativeEvent as any).preventDownshiftDefault = true;
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
        <ul {...getMenuProps({}, { suppressRefError: true })} ref={undefined}>
          {isOpen &&
            allItems.map((item, index) =>
              item.text === "-" ? (
                index === allItems.length - 1 ? (
                  ReactNull
                ) : (
                  <li
                    key={item.key}
                    className={styles.divider}
                    {...getItemProps({ item, disabled: item.disabled, index })}
                  ></li>
                )
              ) : (
                <li
                  key={item.key}
                  {...getItemProps({
                    item,
                    index,
                    className: cx(styles.item, {
                      [styles.highlightedItem]: index === highlightedIndex,
                    }),
                  })}
                >
                  <Icon
                    iconName={item.value === selectedItem.value ? "Checkmark" : ""}
                    style={{ marginRight: theme.spacing.s1 }}
                  />
                  {item.text}
                </li>
              ),
            )}
        </ul>
      </Callout>

      {/* <ComboBox
        // id={comboBoxId}
        allowFreeform
        options={timezoneItems}
        selectedKey={timezone.value}
        onChange={(event, option) => setTimezone(option?.id ?? "")}
        style={{ maxWidth: 300 }}
        calloutProps={{
          directionalHintFixed: true,
          directionalHint: DirectionalHint.bottomAutoEdge,
        }}
      /> */}
    </>
  );
}

export default function Preferences(): React.ReactElement {
  // const [timezone, setTimezone] = useAsyncAppConfigurationValue<string>("timezone");

  // FIXME: these need to set preferences which are read on launch
  const [telemetryEnabled, setTelemetryEnabled] = useState(
    OsContextSingleton?.isTelemetryEnabled(),
  );
  const [crashReportingEnabled, setCrashReportingEnabled] = useState(
    OsContextSingleton?.isCrashReportingEnabled(),
  );

  const theme = useTheme();
  return (
    <Pivot>
      <PivotItem headerText="Settings" style={{ padding: theme.spacing.m }}>
        <Stack.Item>
          <TimezoneSettings />
        </Stack.Item>
      </PivotItem>
      <PivotItem headerText="Privacy" style={{ padding: theme.spacing.m }}>
        <Stack tokens={{ childrenGap: theme.spacing.s1 }}>
          <Text style={{ color: theme.palette.neutralSecondary }}>
            Changes will take effect the next time {APP_NAME} is launched.
          </Text>
          <Checkbox
            checked={telemetryEnabled}
            onChange={(event, checked) => setTelemetryEnabled(checked)}
            label={`Send anonymized usage data to help us improve ${APP_NAME}`}
          />
          <Checkbox
            checked={crashReportingEnabled}
            onChange={(event, checked) => setCrashReportingEnabled(checked)}
            label="Send anonymized crash reports"
          />
        </Stack>
      </PivotItem>
      <PivotItem headerText="Experimental Features" itemIcon="TestBeakerSolid">
        <ExperimentalFeatureSettings />
      </PivotItem>
    </Pivot>
  );
}
