// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
import { Pivot, PivotItem, Stack, useTheme } from "@fluentui/react";
import moment from "moment-timezone";
import { useCallback, useMemo } from "react";

import { ExperimentalFeatureSettings } from "@foxglove-studio/app/components/ExperimentalFeatureSettings";
import FluentAutocomplete, {
  AutocompleteItem,
} from "@foxglove-studio/app/components/FluentAutocomplete";
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
  const fixedItems: AutocompleteItem<string>[] = useMemo(
    () => [
      detectItem,
      { key: "zone:UTC", text: `${formatTimezone("UTC")}`, value: "UTC" },
      { key: "sep", text: "", value: "-separator-", type: "divider" },
    ],
    [detectItem],
  );
  const timezoneItems: AutocompleteItem<string>[] = useMemo(
    () =>
      new Array(10)
        .fill(1)
        .map((_, i) => ({ key: `zone:${i + 1}`, text: `${i + 1}`, value: `${i + 1}` })),
    // filterMap(moment.tz.names(), (name) => {
    //   // UTC is always hoisted to the top in fixedItems
    //   if (name === "UTC") {
    //     return undefined;
    //   }
    //   return { key: `zone:${name}`, text: formatTimezone(name), value: name };
    // }),
    [],
  );

  const getFilteredItems = useCallback(
    (inputValue: string) => {
      const filteredItems = fuzzyFilter(timezoneItems, inputValue, (item) => item.text);
      return [...fixedItems, ...filteredItems];
    },
    [fixedItems, timezoneItems],
  );

  const itemsByValue = useMemo(() => {
    const map = new Map<string, AutocompleteItem<string>>();
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

  return (
    <FluentAutocomplete
      getFilteredItems={getFilteredItems}
      selectedItem={selectedItem}
      onSelectedItemChange={(item) => setTimezone(item.value)}
    />
  );
}

export default function Preferences(): React.ReactElement {
  const theme = useTheme();
  return (
    <Pivot>
      <PivotItem headerText="Settings" style={{ padding: theme.spacing.m }}>
        <Stack.Item>
          <TimezoneSettings />
        </Stack.Item>
      </PivotItem>
      {/* <PivotItem headerText="Privacy" style={{ padding: theme.spacing.m }}>
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
      </PivotItem> */}
      <PivotItem headerText="Experimental Features">
        <ExperimentalFeatureSettings />
      </PivotItem>
    </Pivot>
  );
}
